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
}

export interface BondState {
  state: string;
  preState: string;
}

export interface AdvertisingData {
  isConnectable?: boolean;
  localName?: string;
}
