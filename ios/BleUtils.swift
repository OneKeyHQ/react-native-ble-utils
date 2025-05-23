import Foundation
import CoreBluetooth

@objc(BleUtilsModule)
class BleUtilsModule: NSObject, CBCentralManagerDelegate, CBPeripheralDelegate {
    private var manager: CBCentralManager?
    private let serialQueue = DispatchQueue(label: "BleUtilsModule.serialQueue")
    private var stateChangedCallbacks: [RCTResponseSenderBlock] = []

  @objc
    static func requiresMainQueueSetup() -> Bool {
      return false
    }

    override init() {
      super.init()
      manager = CBCentralManager(delegate: self, queue: nil)
    }

    func centralManagerDidUpdateState(_ central: CBCentralManager) {
        if !stateChangedCallbacks.isEmpty {
            let stateName = Helper.centralManagerStateToString(central.state)
            for callback in stateChangedCallbacks {
                callback([stateName])
            }
            stateChangedCallbacks.removeAll()
        }
    }

    @objc public func checkState(_ callback: @escaping RCTResponseSenderBlock) {
        if let manager = manager {
            if manager.state == .unknown {
                stateChangedCallbacks.append(callback)
            } else {
                let stateName = Helper.centralManagerStateToString(manager.state)
                callback([stateName])
            }
        }
    }

    @objc public func getConnectedPeripherals(_ serviceUUIDStrings: [String],
                                              callback: @escaping RCTResponseSenderBlock) {
        NSLog("Get connected peripherals")
        var serviceUUIDs: [CBUUID] = []

        for uuidString in serviceUUIDStrings {
            serviceUUIDs.append(CBUUID(string: uuidString))
        }

        var connectedPeripherals: [Peripheral] = []

        let connectedCBPeripherals: [CBPeripheral] = manager?.retrieveConnectedPeripherals(withServices: serviceUUIDs) ?? []

        serialQueue.sync {
            for ph in connectedCBPeripherals {
                let peripheral = Peripheral(peripheral: ph)
                connectedPeripherals.append(peripheral)
            }
        }

        var foundedPeripherals: [[String: Any]] = []

        for peripheral in connectedPeripherals {
            foundedPeripherals.append(peripheral.advertisingInfo())
        }

        callback([NSNull(), foundedPeripherals])
    }
}
