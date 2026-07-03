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

      // Expose the device's cached (bonded) service UUIDs so callers can filter
      // themselves. Same field name as scanned devices. May be empty on ROMs that
      // don't cache GATT services in BluetoothDevice.getUuids().
      val serviceUUIDs = Arguments.createArray()
      device.uuids?.forEach { serviceUUIDs.pushString(it.uuid.toString()) }
      map.putArray("serviceUUIDs", serviceUUIDs)
    } catch (e: Exception) { // this shouldn't happen
      Log.e("BleUtils", "Unexpected error on asWritableMap", e)
    }

    return map
  }
}
