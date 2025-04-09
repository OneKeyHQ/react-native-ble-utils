import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import type { BleState, Peripheral, BondState, AdvertisingData } from './type';

const { BleUtilsModule } = NativeModules;
type PairDeviceResult = {
  bonded: boolean;
  bonding: boolean;
};

class BleUtils {
  UiEventEmitter: NativeEventEmitter | null = null;

  constructor() {
    if (Platform.OS !== 'android') return;
    this.UiEventEmitter = new NativeEventEmitter(BleUtilsModule);
  }

  checkState() {
    return new Promise<BleState>((fulfill, _) => {
      BleUtilsModule.checkState((state: BleState) => {
        fulfill(state);
      });
    });
  }

  /**
   * [Android only]
   * @param macAddress
   * @returns
   */
  pairDevice(macAddress: string): Promise<PairDeviceResult> {
    if (Platform.OS !== 'android')
      return Promise.resolve({
        bonded: true,
        bonding: false,
      });
    return new Promise<PairDeviceResult>((fulfill, reject) => {
      BleUtilsModule.pairDevice(
        macAddress,
        (error: string | null, result: PairDeviceResult | null) => {
          if (error) {
            reject(error);
          } else {
            if (result) {
              fulfill(result);
            } else {
              fulfill({
                bonded: false,
                bonding: false,
              });
            }
          }
        }
      );
    });
  }

  /**
   *
   * @param serviceUUIDs [optional] not used on android, optional on ios.
   * @returns
   */
  getConnectedPeripherals(serviceUUIDs: string[] = []) {
    return new Promise<Peripheral[]>((fulfill, reject) => {
      BleUtilsModule.getConnectedPeripherals(
        serviceUUIDs,
        (error: string | null, result: Peripheral[] | null) => {
          if (error) {
            reject(error);
          } else {
            if (result) {
              fulfill(result);
            } else {
              fulfill([]);
            }
          }
        }
      );
    });
  }

  /**
   * [Android only]
   * @returns
   */
  getBondedPeripherals() {
    return new Promise<Peripheral[]>((fulfill, reject) => {
      BleUtilsModule.getBondedPeripherals(
        (error: string | null, result: Peripheral[] | null) => {
          if (error) {
            reject(error);
          } else {
            if (result) {
              fulfill(result);
            } else {
              fulfill([]);
            }
          }
        }
      );
    });
  }

  /**
   * [Android only]
   * preState: 'BOND_NONE', state: 'BOND_BONDING' => start bonding
   * preState: 'BOND_BONDING', state: 'BOND_BONDED' => bonding success
   * preState: 'BOND_BONDED', state: 'BOND_NONE' => bonding failed or bonding canceled
   * @param callback
   */
  onDeviceBondState(callback: (peripheral: Peripheral) => void) {
    if (Platform.OS !== 'android') return;
    this.UiEventEmitter?.addListener('onDeviceBondState', callback);
    return () => {
      this.UiEventEmitter?.removeAllListeners('onDeviceBondState');
    };
  }
}

export default new BleUtils();
export type { BleState, Peripheral, BondState, AdvertisingData };
