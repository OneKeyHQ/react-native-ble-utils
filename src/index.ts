import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import type {
  BleState,
  Peripheral,
  BondState,
  AdvertisingData,
  KeyMissingPeripheral,
  EncryptionChangePeripheral,
  AclDisconnectedPeripheral,
} from './type';

const { BleUtilsModule } = NativeModules;
type PairDeviceResult = {
  bonded: boolean;
  bonding: boolean;
  /**
   * [Android only] True when this call started the bonding. False while `bonding` is
   * true means the system started it, e.g. its own re-pairing after a lost bond.
   * Undefined on native builds that predate the field.
   */
  initiated?: boolean;
};

type NativeConstantName =
  | 'supportsKeyMissingEvent'
  | 'supportsEncryptionChangeEvent';

const readNativeFlag = (name: NativeConstantName): boolean => {
  if (Platform.OS !== 'android' || !BleUtilsModule) return false;
  // Interop exposes legacy constants through getConstants(); the bridge exposes them
  // as plain properties.
  const constants =
    typeof BleUtilsModule.getConstants === 'function'
      ? BleUtilsModule.getConstants()
      : BleUtilsModule;
  return constants?.[name] === true;
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
   * @param serviceUUIDs [optional] filter by service UUID (android + ios); empty = no filter.
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

  /**
   * [Android only]
   * Whether this OS version and native build report `onDeviceKeyMissing`. When false
   * the event never fires, so callers should not wait for it.
   */
  supportsDeviceKeyMissing() {
    return readNativeFlag('supportsKeyMissingEvent');
  }

  /**
   * [Android 16+ only]
   * A bonded device could not provide its keys when the link was encrypted: the device
   * was wiped or removed the bond. Android keeps its side of the bond, so the device
   * stays unusable until the user forgets it in system Bluetooth settings.
   * Each subscription is removed on its own, so several callers can listen at once.
   * @param callback
   */
  onDeviceKeyMissing(callback: (peripheral: KeyMissingPeripheral) => void) {
    const subscription = this.UiEventEmitter?.addListener(
      'onDeviceKeyMissing',
      callback
    );
    return () => {
      subscription?.remove();
    };
  }

  /**
   * [Android only]
   * Whether this OS version and native build report `onDeviceEncryptionChange` and
   * `onDeviceAclDisconnected`. When false those events never fire.
   */
  supportsDeviceEncryptionChange() {
    return readNativeFlag('supportsEncryptionChangeEvent');
  }

  /**
   * [Android 16+ only]
   * The LE link to a device finished an encryption attempt. Android starts it on its own
   * right after connecting to a bonded device, so this reports whether the stored bond
   * still works before any request that needs encryption is sent.
   * Each subscription is removed on its own, so several callers can listen at once.
   * @param callback
   */
  onDeviceEncryptionChange(
    callback: (peripheral: EncryptionChangePeripheral) => void
  ) {
    const subscription = this.UiEventEmitter?.addListener(
      'onDeviceEncryptionChange',
      callback
    );
    return () => {
      subscription?.remove();
    };
  }

  /**
   * [Android 16+ only]
   * The LE link to a device is gone, so earlier encryption results no longer apply.
   * Unlike a GATT disconnect, this does not fire while the system keeps the link alive
   * for another client.
   * @param callback
   */
  onDeviceAclDisconnected(
    callback: (peripheral: AclDisconnectedPeripheral) => void
  ) {
    const subscription = this.UiEventEmitter?.addListener(
      'onDeviceAclDisconnected',
      callback
    );
    return () => {
      subscription?.remove();
    };
  }
}

export default new BleUtils();
export type {
  BleState,
  Peripheral,
  BondState,
  AdvertisingData,
  KeyMissingPeripheral,
  EncryptionChangePeripheral,
  AclDisconnectedPeripheral,
  PairDeviceResult,
};
