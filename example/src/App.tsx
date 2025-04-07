import { useCallback, useEffect, useState } from 'react';
import { Text, View, StyleSheet, Button, ScrollView } from 'react-native';
import BleUtils from 'react-native-ble-utils';
import {
  BleManager as BlePlxManager,
  Device,
  ScanMode,
} from 'react-native-ble-plx';

const blePlxManager = new BlePlxManager();

export default function App() {
  const [devices, setDevices] = useState<Device[]>([]);

  useEffect(() => {
    console.log('BleUtils', 'begin listener bluetooth bond state');
    const unsub = BleUtils.onDeviceBondState((peripheral) => {
      console.log('onDeviceBondState peripheral', peripheral);
    });
    return () => {
      console.log('BleUtils', 'end listener bluetooth bond state');
      unsub?.();
    };
  }, []);

  const scanDevice = useCallback(() => {
    blePlxManager.startDeviceScan(
      null,
      {
        allowDuplicates: false,
        scanMode: ScanMode.LowLatency,
      },
      (_error, device) => {
        console.log('onDeviceFound device', device);
        if (device) {
          setDevices((prev) => {
            if (prev.find((d) => d.id === device.id)) {
              return prev;
            }
            return [...prev, device];
          });
        }
      }
    );
    return () => {
      blePlxManager.stopDeviceScan();
    };
  }, []);

  const stopScan = useCallback(() => {
    blePlxManager.stopDeviceScan();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Button
          title="Check State"
          onPress={() => {
            BleUtils.checkState()
              .then((state) => {
                console.log('checkState state', state);
              })
              .catch((error) => {
                console.log('checkState error', error);
              });
          }}
        />
        <Button
          title="getBondedPeripherals"
          onPress={() => {
            BleUtils.getBondedPeripherals().then((peripherals) => {
              console.log('getBondedPeripherals peripherals', peripherals);
            });
          }}
        />
        <Button
          title="getConnectedPeripherals"
          onPress={() => {
            BleUtils.getConnectedPeripherals([
              '00000001-0000-1000-8000-00805f9b34fb',
            ]).then((peripherals) => {
              console.log('getConnectedPeripherals peripherals', peripherals);
            });
          }}
        />
        <Button title="ScanDevices" onPress={scanDevice} />
        <Button title="StopScan" onPress={stopScan} />
        {devices
          .filter((device) => !!device.name?.trim())
          .map((device) => (
            <View key={device.id} style={styles.device}>
              <Text>{device.name?.trim() ?? ''}</Text>
              <View style={styles.deviceButtons}>
                <Button
                  title="Connect"
                  onPress={() => {
                    blePlxManager
                      .connectToDevice(device.id, {
                        requestMTU: 256,
                        timeout: 3000,
                        refreshGatt: 'OnConnected',
                      })
                      .then((device) => {
                        console.log('connectToDevice device', device);
                      })
                      .catch((e) => {
                        console.log('connectToDevice error', e);
                      });
                  }}
                />
                <Button
                  title="Disconnect"
                  onPress={() => {
                    blePlxManager
                      .cancelDeviceConnection(device.id)
                      .then((device) => {
                        console.log('disconnectDevice device', device);
                      });
                  }}
                />
              </View>
            </View>
          ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingBottom: 40,
  },
  scrollView: {
    flex: 1,
  },
  device: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 4,
  },
  deviceButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingStart: 8,
  },
});
