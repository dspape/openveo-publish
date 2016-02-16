# Introduction

The Watcher is capable of listening to some directories specified during [plugin's configuration](/getting-started#configure-the-watcher).

Two types of files can be copied in these directories :

- [tar files](#tar-files)
- [mp4 files](#mp4-files)

Soon after the file has been copied, it will appear in back end catalogue page where all videos are referenced.

![Back end catalogue video](images/screenshots/back-end-catalogue-video.jpg)

# tar files

tar files are used for videos with synchronized images. A valid tar file must contain a **video file**, a **.session** file, a **synchro.xml** file and a **list of images**.

## .session file

**.session** file is used to store information about the package. It is written in JSON format and must contain at least :

```json
{
  "filename": "video.mp4" // Name of the video file in the package
}
```

It can contain some optional properties :

```json
{
  "date": 1425916390, // The date the video was recorded (in Unix epoch time)
  "rich-media": true // true to indicates that video has associated images, false if only the video is in the package
}
```

**Nb :** All extra properties are kept but won't be used directly by Publish.

## synchro.xml file

**synchro.xml** file is used to map each images to a video timecode. If **rich-media** property is set to "true" in **.session** file, **synchro.xml** file must be present.

It is written in XML format and must respect the following structure :

```xml
<?xml version="1.0"?>
<player>

  <!-- At time 0ms, image slide_00000.jpeg must be displayed (slide_00000.jpeg must be present in the package) -->
  <synchro id="slide_00000.jpeg" timecode="0"/>

  <!-- At time 1400ms, image slide_00001.jpeg must be displayed (slide_00001.jpeg must be present in the package) -->
  <synchro id="slide_00001.jpeg" timecode="1400"/>

  <!-- At time 9500ms, image slide_00002.jpeg must be displayed (slide_00002.jpeg must be present in the package) -->
  <synchro id="slide_00002.jpeg" timecode="9500"/>

</player>
```

## List of images

A list of images to synchronize with the video as defined in **synchro.xml**.

## Video file

An mp4 file corresponding to the one specified by property **filename** in **.session** file.


# mp4 files

If your video doesn't have associated images, a simple mp4 file will be enough.