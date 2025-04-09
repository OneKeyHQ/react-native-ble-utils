package so.onekey.lib.ble.utils.data

import android.annotation.SuppressLint
import android.bluetooth.BluetoothDevice
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap


class Peripheral(
  private val device: BluetoothDevice
) {
  @SuppressLint("MissingPermission")
  fun asWritableMap(): WritableMap {
    val map: WritableMap = Arguments.createMap()
    val advertising: WritableMap = Arguments.createMap()

    try {
      map.putString("name", device.getName())
      map.putString("id", device.getAddress()) // mac address

      val name: String = device.getName()
      if (name != null) advertising.putString("localName", name)

      // No scanResult to access so we can't check if peripheral is connectable
      advertising.putBoolean("isConnectable", true)

      map.putMap("advertising", advertising)
    } catch (e: Exception) { // this shouldn't happen
      Log.e("BleUtils", "Unexpected error on asWritableMap", e)
    }

    return map
  }
}
