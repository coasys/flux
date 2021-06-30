# Changelog
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
This project *loosely* adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). More specifically:

## [0.1.9] - 30/06/2021

### Added
 - Mentions feature in channel view!
 - Profile card on mention click

### Changed
 - Holochain now built from source in CI to ensure that binaries will work on systems without nix installed!
 - Default channel renamed

### Deprecated

### Removed

### Fixed
 - Junto elements now being imported from npm vs in index.html
 - Editor cleaned on enter press

### Security

---

## [0.1.8] - 29/06/2021

### Added
 - Identicon derived from DID as default client side profile picture for users without profile picture uploaded
 - When app is closed it will arrive in the system tray to allow for continued running of holochain and app experience

### Changed

### Deprecated

### Removed

### Fixed
 - Fixed file checking for copying lair-keystore in copy-hc script for darwin target

### Security

---

## [0.1.7] - 28/06/2021

### Added

### Changed
 - We now await loadUrl in prod once window is ready to serve UI
 - Code to start update search in background.ts not starts after user has logged in to ensure win is defined when update callbacks are called

### Deprecated

### Removed

### Fixed
 - Ad4m now waits for holochain & lair to emit ready signals before returning from runHolochain function
 - Update profile will now correctly update the cache after updating
 - Notfication would sometimes be sent if channel was muted

### Security

---
## [0.1.6] - 24/06/2021

### Added

### Changed

### Deprecated

### Removed

### Fixed
 - Holochain connection in ad4m being started in async meaning connection would not always occur before trying to call conductor in subsequent init languages calls

### Security

---

## [0.1.5] - 24/06/2021

### Added
- Push notifications on message received if app not in view!
- Black theme
- Border around modals on 90s theme

### Changed
- Optimised all polling code to use web workers to avoid polluting the main render thread

### Deprecated

### Removed

### Fixed
 - Various fixes on channel notification icons
 - Update to new ad4m version to fix concurrent language installation in new holochain version

### Security

---

## [0.1.4] - 22/06/2021

### Added
- Script to fetch languages on build vs building from src
- Cyberpunk theme!
- Global error popup if ad4m or holochain cannot start
- channel notification icon when live message received during sessions
- use vue virtual scroll again for our scrolling 
- New messages arriving in channel will prompt UI to give notification to scroll to bottom of view
- Holochain now needs to be built manually for each dev install with nix vs built in repo binaries 
- 5 channel views are now kept alive at once to allow for fast rendering/switching between them

### Changed
- Holochain now at latest version @ commit: 8600350687dd80bbc7a5620e8fe71ad55c97eed2 
- Global error now has proper styling
- Use key/value store vs array for channels/communities/messages in vuex store

### Deprecated

### Removed

### Fixed
- Bug where old loading/error dialogues would remain in state after app restart
- Pressing enter would make a new line in the editor
- Sending a message will now always correctly move to bottom of channel

### Security

---

## [0.1.3] - 19/06/2021

### Added
 - Font theming option
 - Added hack warning when joining community
 - Rainbow theme
 - 90s theme
 - Scroll to bottom when new message signals come in

### Changed
 - Signup flow now uses multiple screens
 - Put modals in state so they can be triggered anywhere
 - App data for dev mode no longer shares directory with production data

### Deprecated

### Removed

### Fixed
 - App auto updates only trigger in production

### Security


---
