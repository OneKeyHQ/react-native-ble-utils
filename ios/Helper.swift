import Foundation
import CoreBluetooth

class Helper {
    static func centralManagerStateToString(_ state: CBManagerState) -> String {
        switch state {
        case .unknown:
            return "unknown"
        case .resetting:
            return "resetting"
        case .unsupported:
            return "unsupported"
        case .unauthorized:
            return "unauthorized"
        case .poweredOff:
            return "off"
        case .poweredOn:
            return "on"
        @unknown default:
            return "unknown"
        }
    }

    static func reformatAdvertisementData(_ advertisementData: [String:Any]) -> [String:Any] {
        var adv = advertisementData
        // Rename 'local name' key
        if let localName = adv[CBAdvertisementDataLocalNameKey] {
            adv.removeValue(forKey: CBAdvertisementDataLocalNameKey)
            adv["localName"] = localName
        }

        // Rename 'isConnectable' key
        if let isConnectable = adv[CBAdvertisementDataIsConnectable] {
            adv.removeValue(forKey: CBAdvertisementDataIsConnectable)
            adv["isConnectable"] = isConnectable
        }

        // Rename 'power level' key
        if let powerLevel = adv[CBAdvertisementDataTxPowerLevelKey] {
            adv.removeValue(forKey: CBAdvertisementDataTxPowerLevelKey)
            adv["txPowerLevel"] = powerLevel
        }

        return adv
    }
}

class Peripheral:Hashable {
    var instance: CBPeripheral
    var rssi: NSNumber?
    var advertisementData: [String:Any]?

    init(peripheral: CBPeripheral, rssi: NSNumber? = nil, advertisementData: [String:Any]? = nil) {
        self.instance = peripheral
        self.rssi = rssi
        self.advertisementData = advertisementData
    }

    func setAdvertisementData(_ advertisementData: [String:Any]) {
        self.advertisementData = advertisementData
    }

    func advertisingInfo() -> Dictionary<String, Any> {
        var peripheralInfo: [String: Any] = [:]

        peripheralInfo["name"] = instance.name
        peripheralInfo["id"] = instance.uuidAsString()
        if let adv = self.advertisementData {
            peripheralInfo["advertising"] = Helper.reformatAdvertisementData(adv)
        }

        return peripheralInfo
    }

    static func == (lhs: Peripheral, rhs: Peripheral) -> Bool {
        return lhs.instance.uuidAsString() == rhs.instance.uuidAsString()
    }

    func hash(into hasher: inout Hasher) {
        hasher.combine(instance.uuidAsString())
    }
}

extension CBPeripheral {
    func uuidAsString() -> String {
        return self.identifier.uuidString.lowercased()
    }
}
