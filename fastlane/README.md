fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## iOS

### ios upload_all

```sh
[bundle exec] fastlane ios upload_all
```

Upload everything to App Store Connect (metadata, screenshots, IPA)

### ios upload_metadata

```sh
[bundle exec] fastlane ios upload_metadata
```

Upload only metadata (no binary, no screenshots)

### ios upload_screenshots

```sh
[bundle exec] fastlane ios upload_screenshots
```

Upload only screenshots

### ios upload_screenshots_locale

```sh
[bundle exec] fastlane ios upload_screenshots_locale
```

Upload screenshots for a single locale

### ios upload_binary

```sh
[bundle exec] fastlane ios upload_binary
```

Upload only the IPA binary

### ios validate

```sh
[bundle exec] fastlane ios validate
```

Validate metadata and screenshots without uploading

### ios setup_app

```sh
[bundle exec] fastlane ios setup_app
```

Set app pricing to Free and privacy to No Data Collected

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
