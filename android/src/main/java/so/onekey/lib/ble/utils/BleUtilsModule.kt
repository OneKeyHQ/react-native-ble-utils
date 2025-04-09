package so.onekey.lib.ble.utils

import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothProfile.GATT
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import so.onekey.lib.ble.utils.data.Peripheral


class BleUtilsModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private var bluetoothManager: BluetoothManager? = null
  private val mBleBroadcastReceiver = lazy {
    MyBroadcastReceiver(this)
  }

  override fun getName() = NAME

  private fun getBluetoothManager(): BluetoothManager? {
    if (bluetoothManager == null) {
      bluetoothManager =
        reactContext.getSystemService(Context.BLUETOOTH_SERVICE)
    }
    return bluetoothManager
  }

  private fun getBluetoothAdapter(): BluetoothAdapter? {
    return getBluetoothManager()?.adapter
  }

  init {
    registerBluetoothReceiver()
  }

  private fun registerBluetoothReceiver() {
    if (getBluetoothAdapter() == null) {
      Log.d(LOG_TAG, "No bluetooth support")
      return
    }

    val filter = IntentFilter(BluetoothAdapter.ACTION_STATE_CHANGED)
    filter.addAction(BluetoothDevice.ACTION_BOND_STATE_CHANGED)
    val intentFilter = IntentFilter(BluetoothDevice.ACTION_PAIRING_REQUEST)
    intentFilter.priority = IntentFilter.SYSTEM_HIGH_PRIORITY
    if (Build.VERSION.SDK_INT >= 34) {
      // Google in 2023 decides that flag RECEIVER_NOT_EXPORTED or RECEIVER_EXPORTED should be explicit set SDK 34(UPSIDE_DOWN_CAKE) on registering receivers.
      // Also the export flags are available on Android 8 and higher, should be used with caution so that don't break compability with that devices.
      reactContext.registerReceiver(mBleBroadcastReceiver.value, filter, Context.RECEIVER_EXPORTED)
      reactContext.registerReceiver(
        mBleBroadcastReceiver.value,
        intentFilter,
        Context.RECEIVER_EXPORTED
      )
    } else {
      reactContext.registerReceiver(mBleBroadcastReceiver.value, filter)
      reactContext.registerReceiver(mBleBroadcastReceiver.value, intentFilter)
    }
    Log.d(LOG_TAG, "BleManager initialized")
  }

  // 向JS端发送设备绑定状态变化事件
  fun emitOnDeviceBondState(params: WritableMap) {
    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit("onDeviceBondState", params)
  }

  // 事件监听管理
  @ReactMethod
  fun addListener(eventName: String) {
    // 实现为空，仅用于满足RN事件监听器注册需求
    Log.d(LOG_TAG, "addListener $eventName")
  }

  @ReactMethod
  fun removeListeners(count: Int) {
    // 实现为空，仅用于满足RN事件监听器注册需求
    Log.d(LOG_TAG, "removeListeners $count")
  }

  @ReactMethod
  fun checkState(callback: Callback) {
    Log.d(LOG_TAG, "checkState")

    val adapter = getBluetoothAdapter()
    var state = "off"
    if (!reactContext.getPackageManager().hasSystemFeature(PackageManager.FEATURE_BLUETOOTH_LE)) {
      state = "unsupported"
    } else if (adapter != null) {
      when (adapter.state) {
        BluetoothAdapter.STATE_ON -> state = "on"
        BluetoothAdapter.STATE_TURNING_ON -> state = "turning_on"
        BluetoothAdapter.STATE_TURNING_OFF -> {
          state = "turning_off"
        }

        BluetoothAdapter.STATE_OFF -> {
          // should not happen as per https://developer.android.com/reference/android/bluetooth/BluetoothAdapter#getState()
          state = "off"
        }

        else -> {
          state = "off"
        }
      }
    }

    val map: WritableMap = Arguments.createMap()
    map.putString("state", state)
    Log.d(LOG_TAG, "state:$state")
    callback.invoke(state)
  }

  @SuppressLint("MissingPermission")
  @ReactMethod
  fun getBondedPeripherals(callback: Callback) {
    val map: WritableArray = Arguments.createArray()
    val deviceSet: Set<BluetoothDevice> = getBluetoothAdapter()?.getBondedDevices() ?: emptySet()
    for (device in deviceSet) {
      val peripheral = Peripheral(device)
      val jsonBundle: WritableMap = peripheral.asWritableMap()
      map.pushMap(jsonBundle)
    }
    callback.invoke(null, map)
  }

  @SuppressLint("MissingPermission")
  @ReactMethod
  fun getConnectedPeripherals(serviceUUIDs: ReadableArray?, callback: Callback) {
    Log.d(LOG_TAG, "Get connected peripherals")
    val map: WritableArray = Arguments.createArray()

    if (getBluetoothAdapter() == null) {
      Log.d(LOG_TAG, "No bluetooth support")
      callback.invoke("No bluetooth support")
      return
    }

    val peripherals: List<BluetoothDevice> =
      getBluetoothManager()?.getConnectedDevices(GATT) ?: emptyList()
    for (entry in peripherals) {
      val peripheral = Peripheral(entry)
      val jsonBundle: WritableMap = peripheral.asWritableMap()
      map.pushMap(jsonBundle)
    }
    callback.invoke(null, map)
  }

  private class MyBroadcastReceiver(private val module: BleUtilsModule) : BroadcastReceiver() {
    @SuppressLint("MissingPermission")
    override fun onReceive(context: Context, intent: Intent) {
      Log.d(LOG_TAG, "onReceive")
      val action = intent.action

      if (action == BluetoothDevice.ACTION_BOND_STATE_CHANGED) {
        val bondState = intent.getIntExtra(BluetoothDevice.EXTRA_BOND_STATE, BluetoothDevice.ERROR)
        val prevState = intent.getIntExtra(
          BluetoothDevice.EXTRA_PREVIOUS_BOND_STATE, BluetoothDevice.ERROR
        )
        val device = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
          intent.getParcelableExtra(
            BluetoothDevice.EXTRA_DEVICE, BluetoothDevice::class.java
          )
        } else {
          intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE)
        }

        var bondStateStr = "UNKNOWN"
        when (bondState) {
          BluetoothDevice.BOND_BONDED -> bondStateStr = "BOND_BONDED"
          BluetoothDevice.BOND_BONDING -> bondStateStr = "BOND_BONDING"
          BluetoothDevice.BOND_NONE -> bondStateStr = "BOND_NONE"
          BluetoothDevice.ERROR -> bondStateStr = "BOND_ERROR"
        }

        var prevBondStateStr = "UNKNOWN"
        when (prevState) {
          BluetoothDevice.BOND_BONDED -> prevBondStateStr = "BOND_BONDED"
          BluetoothDevice.BOND_BONDING -> prevBondStateStr = "BOND_BONDING"
          BluetoothDevice.BOND_NONE -> prevBondStateStr = "BOND_NONE"
          BluetoothDevice.ERROR -> bondStateStr = "BOND_ERROR"
        }
        Log.d(LOG_TAG, "bond state: $bondStateStr")
        Log.d(LOG_TAG, "bond state: $prevBondStateStr")

        val bond = Arguments.createMap()
        bond.putString("state", bondStateStr)
        bond.putString("preState", prevBondStateStr)

        val peripheral = Peripheral(device!!)
        val map = peripheral.asWritableMap()
        map.putMap("bondState", bond)
        Log.d(LOG_TAG, "onReceive BluetoothDevice BondState Change ${map}")
        module.emitOnDeviceBondState(map)
      }
    }
  }

  companion object {
    const val NAME = "BleUtilsModule"
    const val LOG_TAG: String = "RNBleUtils"
  }
}
