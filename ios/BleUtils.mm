#import "React/RCTBridgeModule.h"
#import <CoreBluetooth/CoreBluetooth.h>
#import <Foundation/Foundation.h>

@interface RCT_EXTERN_MODULE(BleUtilsModule, NSObject)


RCT_EXTERN_METHOD(getConnectedPeripherals:(NSArray *)serviceUUIDStrings
                  callback:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(checkState:(RCTResponseSenderBlock)callback)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

@end
