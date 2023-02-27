# Changelog

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
This project _loosely_ adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). More specifically:

## [0.5.2] - 26/02/2023

### Added
 - New voice/video chat channel type!
 - Chrome PWA download

### Changed
 - Upgrade to AD4M version v0.2.16

### Deprecated

### Removed

### Fixed

### Security

## [0.5.1] - 02/02/2023

### Added

### Changed
 - Update all ad4m deps to 0.2.11
 - Use new link language hash

### Deprecated

### Removed

### Fixed

### Security

## [0.5.0] - 01/02/2023

### Added
 - Expand icon for channel views
 - Cards will now load before we receive the data to avoid the text jumping around once card data loads
 - Confirmation modal when leaving a community

### Changed
 - Limit avatar img to accept image/*
 - If we have incompatible AD4M versions we will now point the user toward a new ad4m download
 - Code now refactored to live in app, packages and views directories
 - No link constants exist inside of Flux app anymore but instead in utils package
 - Rename delete community to leave community
 - New link language hash with simplified latest revision handling
 - All packages now use consistent version numbers

### Deprecated

### Removed

### Fixed
 - Channel header layout on mobile
 - Author of replied posts being incorrectly returned as the author of the reply post itself
 - Reaction being added twice through emoji picker
 - But where it was possible to remove a reaction before it was sync'd
 - Bug causing hydrate state not to complete fully
 - Incorrect image being shown in mention list
 - Join button now hidden on neighbourhood cards if already joined
 - Predicates are now grouping more effectively in the graph
 - Image cropper not appearing correctly on first load

### Security

## [0.4.2] - 20/01/2023

### Added
 - New cli tool for building flux perspective views
 - Graph view perspective view type
 - Emoji reactions are now optimistic
 - Subtle animation for emoji and chat message loading

### Changed
 - Tweak styling slightly
 - Use new perspective diff sync with improved logic

### Deprecated

### Removed
 - Loading indicator for profile images

### Fixed
 - Async routing
 - Joining a neighbourhood from click
 - Member count in group
 - Edit cursor fixed in chat view

### Security

## [0.4.1] - 16/01/2023

### Added
 - Forum post editing
 - Delete posts
 - New UI after joining a community to allow for navigation to channels without using sidebar
 - New UI and loading animations when you join a community and are waiting for data to sync
 - If a user joins a community; navigate to it by default

### Changed
 - Use ipfs public gateway instead of cloudflare
 - Member links now used to determine if we are sync'd with a community
 - Use new link language with more effecient active agent fetching & reduce ad4m logging
 - Improved rendering of avatars

### Deprecated

### Removed

### Fixed
 - Neighbourhood links are now parsed out of pasted joining code
 - You can no longer post empty comments on posts
 - Username should now prepopulate from ad4m on signup
 - Fix disclaimer model showing too often
 - Messages are now added to the UI optimistically with indication of when they sync to the network
 - Fixed creating null image expressions if we do not provide images for a community
 - Not being able to press space in forum post body
 - Not being able to press tab to move between title and body when making a forum post
 - Show correct image when editing/removing an image 
 - Community image trying to resolve on IPFS even if it does not exist
 - Already sync'd community will not incorrectly show sync screen on reload
 - Refresh when looking at a post will correctly maintain view on that post

### Security

## [0.4.0] - 04/01/2023

### Added
 - Fallback to public IPFS gateway if images not resolved by local node
 - Forum view, with ability to post; links, long form text and images
 - Ability to add multiple views to a channel
 - Side bar folders for different views on channels
 - Mechanism for updating & managing social dna versions
 - Signup flow greatly improved with intro experience explaining Flux
 - Scrolling to a very old reply will now work correctly and move to that area of that chat
 - Posts have a comment section
 - Messages which have not been sync'd with the DHT will not appear grey until sync'd
 - Generic model class structure to allow easy iteration of features & abstracting of link management
 - AD4M connect will now always download the latest version for your OS
 - Prompt to join a testing community when opening Flux
 - All images are now compressed before being uploaded to IPFS
 - Loading indicator when joining a community

### Changed
 - Community, channel & forum structures now use new Entry API models
 - Holochain now using version 0.1.0-beta-rc.1
 - IPFS now using version 0.65.0
 - All API / AD4M methods now exist in their own utils package, and no longer in app logic
 - AD4MIN UI refreshed & rebuilt
 - Adding and or removing multiple links will now happen in one ad4m / holochain operation

### Deprecated
 - Signup flow no longer asks for first or last name

### Removed

### Fixed
 - Many reloads of profiles when hovering over an emoji
 - Community tweaks editing now happens with atomic operations
 - Links will now load metadata right after pasting into link box
 - Inconsistent updating of profile when changing any text or images
 - Neighbourhood link cards in chat will only be joinable if not already joined
 - Image loading across the app is more consistent and makes better use of caching logic
 - Switching between communities is now smoother
 - Literals are now encoded correctly
 - Lookbehind regex breaking flux UI in safari
 - Web components now have correct typescript typing
 - Netlify build script fixed

### Security


## [0.3.1] - 08/11/2022

### Added

- Chat view repo
- Utils repo
- Pagination now used when fecthing messages
- Toggle for enabling notifications on signup and in settings
- picker styles on texteditor
- Hovering over emoji's will now popup author
- Ability to delete a channel
- Community tweaks! Ability to determine popular posts by emoji counts
- Ability to edit messages!

### Changed

- Flux code base is now a monorepo
- Display username in message notifications
- Limit message width
- Improve mention rendering
- Increase message page size to 50
- Use latest ad4m connect version
- Improve hydrate state
- Autofocus improved to focus message input when changing channels
- Improve loading of profiles

### Deprecated

### Removed

- Usage of perspective proxy and instead rely on new mutateAgentPerspective function in ad4m

### Fixed

- Theme handling
- Small colour tweaks to increase visibility
- Getting notifications from self
- Chat messages do not jump around when messages load
- MessageItem are now less expensive to render
- Better placeholder skelto
- Scrolling performance increased
- Image & member loading performance increased

### Security

---

## [0.3.0] - 06/10/2022

### Added

- Users ad4m-connect to maintain and create a connection to an ad4m-executor
- AD4M data state will be hydrated in Flux between sessions
- Now possible to load existing AD4M perspectives as communities in Flux
- Profile data preloaded on signup from AD4MIN
- Web notifications
- Basic mobile UI support
- Communities can now be deleted correctly

### Changed

- Channels are now kept alive between navigation
- Prolog now used to query messages on a perspective
- Use all new link language which much greater performance, and reliability
- ChatView now loads from in app and not fetched from npm at runtime
- Link structure revamped, more interopable with other ad4m applications & uses true expression urls for link data

### Deprecated

### Removed

- Electron removed! Flux is now a web based app
- No longer spawns its own ad4m-executor but relies on a connection to AD4MIN
- All polling code removed and all mutations arrive to UI via signals

### Fixed

- profile loading revamped to be more effective
- bug where deleting a community would remove all links from it for all members
- various bugs with emojis which would cause duplicates
- member links not showing up in UI as people joined the community

### Security

---

## [0.2.17] - 04/03/2022

### Added

### Changed

- Holochain upgraded to version 127

### Deprecated

### Removed

### Fixed

- GraphQL app port is now correctly communicated with ad4mClient & perspective views

### Security

---

## [0.2.16] - 07/02/2022

### Added

- Ability to copy Flux logs from splash screen
- caching on expressions @ ad4m-executor where language is immutable
- added CAL

### Changed

- Using holochain version 0.0.125
- replies and emojis are loaded async after initial message load to reduce loading time
- use indexdb for profile storage to avoid filling localStorage
- only fetch 35 messages per page

### Deprecated

### Removed

- Many un-used dependencies

### Fixed

- Notifications working again
- ad4m-executor will now check which port to use when starting gql server to avoid collisions
- fixed bug where name for communities could all become the same
- members name not being present when making a reply
- various bugs with the handling of emojis on a message
- error when channel views would sometimes not load correctly

### Security

---

## [0.2.15] - 23/01/2022

### Added

- Laid foundation for custom perspective views allowing for different views over neighbourhoods
- Emoji responses on messages!
- Reply to messages!
- new members & channels are now added to state as they are created and received via signals

### Changed

- Chatview now react based component loaded via cdn at runtime
- holochain now on version 0.0.123
- improve neighbourhood references within links and remove use of: self://
- increased wait time for channel polling queries

### Deprecated

### Removed

### Fixed

- Chatview performance now considerably improved
- Several bugs fixed with pagination on chat messages
- App crashing on load when many communities installed now fixed
- Fixed async holochain bug in holochain when multiple zome calls run in async causing some interactions not to complete fully
- Order of firstname and second name now correct on profile
- ascending querying of messages now working correctly
- improved query time for link languages

### Security

---

## [0.2.14] - 04/01/2022

### Added

- Use new neighbourhood persistence language that leverages storj + lambda
- New language language which leverages CDN + lambda for faster downloads / uploads

### Changed

- Improve UI for agent profiles

### Deprecated

### Removed

### Fixed

- Bugs with editing / adding links on profile
- Bug where languages for community would not be installed after creation

### Security

---

## [0.2.13] - 14/12/2021

### Added

- Loading indicator now shown when community member links have been found but no profiles resolved

### Changed

- Storj now used for storing language & neighbourhood objects to improve community creation & joining reliability

### Deprecated

### Removed

### Fixed

### Security

---

## [0.2.12] - 9/12/2021

### Added

- Agent profiles!!! Includes linking neighbourhoods, galleries and web links

### Changed

- Improved naming solution for languages
- Social Context can now listen to limit in link queries
- holochain updated to 119!

### Deprecated

### Removed

- Language UI caching, not required by application design anymore
- Database perspective, we now rely entirely on our internal store

### Fixed

- Bug where config would not be deleted in production on new app version due to looking in wrong config directory
- Social context now has signals correctly enabled
- Invite link text now reads Flux vs Junto
- Improved callback logic for expression polling upon link signals

### Security

---

## [0.2.11] - 19/11/2021

### Added

- Notification indicator to community avatar
- Mute options for community
- Default values for community notification settings
- Channel list now collapsable
- Snap package to linux build

### Changed

- Muted channels are now hidden
- Font sizes now scale to greater sizes and allow variable sizing
- Upgrade holochain to version 115!

### Deprecated

### Removed

### Fixed

### Security

---

## [0.2.10] - 27/10/2021

### Added

### Changed

- When user creating agent if password is invalid disable the next button

### Deprecated

### Removed

### Fixed

- Openssl/boringssl error when using older version of ipfs with bcrypto dependency that effected some Linux installations
- Low timeout on link query causing some channels not to load messages
- If password error is shown, clear error when password requirements are met
- Issue where group avatar would not update for some members

### Security

---

## [0.2.9] - 18/10/2021

### Added

### Changed

### Deprecated

### Removed

### Fixed

- Fix error when copying debug.log file to desktop on error splash screen
- Fix error when no group expression links are found on community

### Security

---

## [0.2.8] - 15/10/2021

### Added

- Added button to copy log file to desktop when global error is shown
- Members on community now also added by signals

### Changed

- New Flux logo's!
- Renamed application name from Junto -> Flux where applicable
- Loading screen now uses flux wordmark
- Cache service now uses levelDB
- Store now only saves array of did's for user instead of entire profile data to save bloating the store
- Logo's and animations now use flux design

### Deprecated

### Removed

- Old files & images
- Member & group expression workers removed and replaced with single gql call on community route change
- Logout option

### Fixed

- Global variables now used for all places where worker polling happens and poll delay used
- MessageView now only tries to load unique did profiles for expression messages and not duplicate agents
- Now correctly using thumbnail for rendering profile images on messages
- Added id to expression worker loops to avoid duplicate getExpression calls when resolving signals / links
- Home channel now shows correct name in Channel header information

### Security

---

## [0.2.7] - 11/10/2021

### Added

- Cargo caching to Github actions release build
- More detailed information when joining a community

### Changed

- Tweak size and type of avatar upload button
- Improved join/create community

### Deprecated

### Removed

### Fixed

- Broken jest config for test
- Profile picture being too large and killing holochain (now use IPFS for storage)
- Community picture being too large and killing holochain (now use IPFS for storage)
- Bug where ad4m would not be killed correctly in production MacOS
- Links in gitbook opening in the electron browser window (now opens in default browser)

### Security

---

## [0.2.6] - 07/10/2021

### Added

- Confirm modal when cleaning state

### Changed

### Deprecated

### Removed

- Windows build
- Apollo composable dependency
- Old database perspective that was created on user signup
- Expression UI caching when joining or creating a community

### Fixed

- Language language throwing error in production
- Service worker load error on mac in production
- Correctly init main neighbourhood as home channel when joining a channel
- Added membrane root value on neighbourhood when creating and joining a neighbourhood

### Security

---

## [0.2.5] - 01/10/2021

### Added

- Windows build support

### Changed

- Holochain upgraded to version 109
- Base social-context that is created when creating a community is now also used as the link store for the home channel

### Deprecated

### Removed

### Fixed

### Security

---

## [0.2.4] - 01/10/2021

### Added

### Changed

### Deprecated

### Removed

- Vulnrability warning when joining a community

### Fixed

- More ad4m-executor quit calls on sigint's and other application close events to fix ipfs.lock issues
- Allow insecure requests in language due to ssl errors on language language API

### Security

---

## [0.2.3] - 30/09/2021

### Added

- Added button to copy logs to desktop inside settings -> privacy to allow for easier error reporting
- Deadlock on channel worker to avoid duplicate channels being added

### Changed

- Set no-cache headers in polling worker gql requests
- Added static sleep for polling on link expressions and chat expressions

### Deprecated

### Removed

### Fixed

- Fixed bug where batched grabbed expressions returning null would break store mutation
- Logs when starting app cleaned up

### Security

---

## [0.2.2] - 28/09/2021

### Added

- Language signature verification to fix remote code exec vulnrability on ad4m!
- Now save trusted ad4m agents to allow for verification of languages to be installed by ad4m

### Changed

- Chat messages from retrieved links are now loaded in bulk, improves performance and UX
- Holochain updated to version 107
- Centralized language language version used to avoid gossip problems on

### Deprecated

### Removed

### Fixed

### Security

---

## [0.2.1] - 02/09/2021

### Added

- New property on polling worker to handle static polling
- Now polling for community members
- Mute button now also added to channel header

### Changed

- Save createdAt field for community on neighbourhood meta
- Use createdAt field for community to inform limit of expression link polling worker
- Dark theme now used by default
- Disable text selection across app except on messages
- Typescript version bumped
- Various small UI improvements and fixes

### Deprecated

### Removed

### Fixed

- Error where polling for data the first time returned undefined
- IDB bug coming from emoji picker
- Community avatar src as unknown
- Random worker termination
- getMembers functionality
- Bug where profile expression would be of the wrong shape and not get saved into the DNA correctly
- Member search total fixed
- Init themes on startup

### Security

---

## [0.2.0] - 26/08/2021

### Added

- Signup now uses a carousel
- Auto navigate to community/channel after creation of either
- Home view which provides overview of installed neighbourhoods & overview of Junto
- Full testing environment which tests store code and util methods
- Ability to add an image to a community when creating or updating
- Pagination when getting channel messages that have not been loaded via signals
- Proper scrolling/loading of channel messages
- CMS layer for updating Junto home information
- UI now looks for owner of neighbourhood/community and only allows edit community operations if current agent is owner
- Cached expression messages are now deleted on app close

### Changed

- Background thread code now lives in its own module with proper code seperation
- Many general UI/style improvements
- Integrated with ad4m 0.1.0 ontology #84
- Large store structure refactor to improve app performance
- Web worker code optimized to avoid the spawning of many workers
- Pinia now used as storage layer vs vuex
- Holochain bumped to version 103
- Themeing now more simplified to allow for easier theme creation
- Cyberpunk theme improved to have different styles for button shapes and animations
- Name, description, author and createdAt attributes now saved on neighbourhood meta
- Refactor of ChannelView to make code more readible with multiple components

### Deprecated

### Removed

### Fixed

- Bug where app would briefly flash on register screen before showing login screen even if agent had previously signed
- Fixed bug where paginated results from social-context would not be correctly returned
- Incorrect saving of scroll position when navigating between channels
- Duplicate expression message polling loops being created when navigating to channels
- Duplicate expression load polling loops being created when trying to resolve retreived channel link targets
- Bug where going to home view would break future navigation

### Security

---

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
