/**
 * android states: https://developer.android.com/reference/android/bluetooth/BluetoothAdapter#EXTRA_STATE
 * ios states: https://developer.apple.com/documentation/corebluetooth/cbcentralmanagerstate
 * */
export enum BleState {
  /**
   * [iOS only]
   */
  Unknown = 'unknown',
  /**
   * [iOS only]
   */
  Resetting = 'resetting',
  Unsupported = 'unsupported',
  /**
   * [iOS only]
   */
  Unauthorized = 'unauthorized',
  On = 'on',
  Off = 'off',
  /**
   * [android only]
   */
  TurningOn = 'turning_on',
  /**
   * [android only]
   */
  TurningOff = 'turning_off',
}

export interface Peripheral {
  id: string;
  name?: string;
  advertising: AdvertisingData;
  bondState: BondState;
  serviceUUIDs?: string[];
}

export interface BondState {
  state: string;
  preState: string;
  /** Android EXTRA_UNBOND_REASON, when supplied by the system. */
  reason?: number;
}

export interface AdvertisingData {
  isConnectable?: boolean;
  localName?: string;
}
