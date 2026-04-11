# WildTales

WildTales is a mobile travel app built with React Native and Expo. It is designed to help users save travel memories and improve personal safety while travelling. The app supports saved places, journeys, live trip tracking, offline-aware behaviour, and safety tools such as contact selection, retry logic, and SMS fallback.

## Main features

- Save places with a title, note, photos, and GPS location
- Browse places in list and map views
- Track live trips in Safety mode, including route points, distance, and duration
- Save completed trips as journeys with a route snapshot and photos
- Use safety tools such as contact picker, offline retry, and SMS fallback
- Work with on-device storage, offline support, and orphan image cleanup for safer local media handling

## Technology used

WildTales uses React Native and Expo for the mobile application, Expo device APIs for location, images, contacts, SMS, network state, task management, file storage, and SQLite, and an API/server layer for sending safety location logs beyond the device. Local data is stored on-device with SQLite, while pending safety updates can be retried when connectivity returns. 

## Installation instructions

### Option 1: Run from the public GitHub repository with Expo Go

1. Clone the repository:

```bash
git clone https://github.com/Doomciak/wildtales.git
```

2. Open the project folder:

```bash
cd wildtales
```

3. Install dependencies:

```bash
npm install
```

4. Start the Expo development server:

```bash
npx expo start
```

5. If Expo asks to install the required package on a fresh computer, confirm by typing:

```bash
y
```

6. Open the app in Expo Go by scanning the QR code shown in the terminal.

7. If Expo requests authentication, sign in with your Expo account and continue.



### Option 2: Install the APK on Android

1. Download the provided [WildTales APK](https://expo.dev/accounts/doomciak/projects/WildTales/builds/f9dd275a-d6ba-492f-a6b1-6eaa242d27f8).
2. Open the APK file on the Android device.
3. Allow installation from unknown sources if Android requests permission.
4. Install the app and open WildTales.
5. Allow the requested permissions for location, photos, camera, and contacts so the main features work correctly.

## Usage guidelines

### Home

After opening the app, swipe up **Go** to enter the main interface. The Home screen shows saved totals, quick actions, and recent place and journey highlights. Bottom navigation is used to move between the main sections of the app. 

### Places

Use the **Places** tab to browse saved places in list view or map view. You can:

- open a place preview
- edit a saved place
- manage photos
- clear or update a saved location
- delete a place
- search and filter by country and city 

### Safety

Use the **Safety** tab to:

- choose a safety contact
- start or stop a trip
- view live route tracking
- see distance, duration, and status updates
- retry pending online updates
- run the SMS fallback test
- send the latest location by text message
- review recent saved location logs

After stopping a trip, the completed route can be saved as a journey. 

### Journeys

Use the **Journeys** tab to browse saved routes, open journey details, edit the title, note, or photos, and delete a journey when needed.

### Add Place

Use the **Add** tab to create a new place by entering a title and note, adding photos, and optionally saving the current device location before storing the place. 

## Additional setup notes

- The project uses mobile permissions for location, photos, camera, and contacts. Some features will not work correctly until these permissions are granted. 
- Safety tracking stores route data locally first and then attempts to upload location logs through the API. If delivery fails, logs remain pending and are retried later. 
- The app follows an offline-first approach. When the device is offline, some sync operations are skipped and retried later, and map-related behaviour may be limited. 
- WildTales includes orphan file handling for managed media, which helps prevent unused local image files from building up after edit or delete actions. 
- Expo Go worked without manually providing a Google Maps Android API key, but APK/native builds required additional Google Maps configuration. 


## Future improvements

Planned future improvements include:

- improving SMS fallback behaviour
- making background tracking more accurate and stable
- adding video uploads
- adding authentication for security
- continuing to develop the Safety feature further
