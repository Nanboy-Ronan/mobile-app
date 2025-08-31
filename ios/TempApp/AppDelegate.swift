import UIKit
import React
import React_RCTAppDelegate

@main
class AppDelegate: RCTAppDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    // Must match AppRegistry name from app.json
    self.moduleName = "mobile-app"
    print("[AppDelegate] moduleName=\(self.moduleName) DEBUG=\(String(describing: _isDebugAssertConfiguration()))")
    self.initialProps = [:]
    #if DEBUG
      // Enables Fast Refresh and other dev settings (if available)
      if let utilsClass = NSClassFromString("RCTAppSetupUtils") {
        _ = (utilsClass as AnyObject).perform(NSSelectorFromString("registerDevSettings"))
      }
    #endif
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  // Provide the JS bundle URL to React Native (required by RCTAppDelegate)
  @objc override func sourceURL(for bridge: RCTBridge!) -> URL! {
    #if DEBUG
      let url = RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index", fallbackExtension: nil)
      print("[AppDelegate] sourceURL(for:) -> \(url?.absoluteString ?? "nil")")
      return url
    #else
      let url = Bundle.main.url(forResource: "main", withExtension: "jsbundle")
      print("[AppDelegate] sourceURL(for:) -> \(url?.absoluteString ?? "nil")")
      return url
    #endif
  }

  // Some codepaths use bundleURL() directly; mirror the same logic.
  @objc override func bundleURL() -> URL! {
    #if DEBUG
      let url = RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index", fallbackExtension: nil)
      print("[AppDelegate] bundleURL() -> \(url?.absoluteString ?? "nil")")
      return url
    #else
      let url = Bundle.main.url(forResource: "main", withExtension: "jsbundle")
      print("[AppDelegate] bundleURL() -> \(url?.absoluteString ?? "nil")")
      return url
    #endif
  }
}
