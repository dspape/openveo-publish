'use strict';

// Module dependencies
var readline = require('readline');
var path = require('path');
var fs = require('fs');
var os = require('os');
var async = require('async');
var openVeoAPI = require('@openveo/api');
var confDir = path.join(openVeoAPI.fileSystem.getConfDir(), 'publish');

var exit = process.exit;

// Set module root directory
process.rootPublish = __dirname;
process.requirePublish = function(filePath) {
  return require(path.join(process.rootPublish, filePath));
};

// Create a readline interface to interact with the user
var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Creates conf directory if it does not exist.
 */
function createConfDir(callback) {
  openVeoAPI.fileSystem.mkdir(confDir, callback);
}

/**
 * Creates logger directory if it does not exist.
 */
function createVideoTmpDir(callback) {
  var conf = require(path.join(confDir, 'publishConf.json'));
  openVeoAPI.fileSystem.mkdir(conf.videoTmpDir, callback);
}

/**
 * Creates hot folders if they do not exist.
 */
function createHotFolder(callback) {
  var conf = require(path.join(confDir, 'watcherConf.json'));
  var parallelFunctions = [];

  /**
   * Adds closure to create a hot folder.
   *
   * @param {String} hotFolderPath The path to the hot folder to create
   * @return {Function} A function to call with async
   */
  function createFunction(hotFolderPath) {
    return function(callback) {
      openVeoAPI.fileSystem.mkdir(hotFolderPath, callback);
    };
  }

  // Create a function for each hot folder
  for (var i = 0; i < conf.hotFolders.length; i++)
    parallelFunctions.push(createFunction(conf.hotFolders[i].path));

  // Create hot folders
  async.parallel(parallelFunctions, function(error, results) {
    if (error)
      throw error;
    else
      callback();
  });

}

/**
 * Creates general configuration file if it does not exist.
 */
function createConf(callback) {
  var confFile = path.join(confDir, 'publishConf.json');

  fs.exists(confFile, function(exists) {
    if (exists) {
      process.stdout.write(confFile + ' already exists\n');
      callback();
    } else {
      var defaultPath = path.join(os.tmpdir(), 'openveo', 'publish', 'videos');
      rl.question('Enter video temporary directory path (default: ' + defaultPath + ') :\n', function(answer) {
        var conf = {
          videoTmpDir: (answer || defaultPath).replace(/\\/g, '/'),
          maxConcurrentPublish: 3,
          timecodeFileName: 'synchro.xml',
          metadataFileName: '.session'
        };

        fs.writeFile(confFile, JSON.stringify(conf, null, '\t'), {encoding: 'utf8'}, callback);
      });
    }
  });
}

/**
 * Creates loggers configuration file if it does not exist.
 */
function createLoggerConf(callback) {
  var confFile = path.join(confDir, 'loggerConf.json');

  fs.exists(confFile, function(exists) {
    if (exists) {
      process.stdout.write(confFile + ' already exists\n');
      callback();
    } else {
      var defaultPath = path.join(os.tmpdir(), 'openveo', 'logs');
      rl.question('Enter logger directory path for watcher process (default: ' + defaultPath + ') :\n',
      function(answer) {
        var conf = {
          watcher: {
            fileName: path.join((answer || defaultPath), 'openveo-watcher.log').replace(/\\/g, '/'),
            level: 'info',
            maxFileSize: 1048576,
            maxFiles: 2
          }
        };

        fs.writeFile(confFile, JSON.stringify(conf, null, '\t'), {encoding: 'utf8'}, callback);
      });
    }
  });
}

/**
 * Creates video platform configuration file if it does not exist.
 */
function createVideoPlatformConf(callback) {
  var confFile = path.join(confDir, 'videoPlatformConf.json');
  var vimeoConf;
  var youtubeConf;
  var wowzaConf;

  async.series([
    function(callback) {
      fs.exists(confFile, function(exists) {
        if (exists)
          callback(new Error(confFile + ' already exists\n'));
        else
          callback();
      });
    },
    function(callback) {
      rl.question('Do you want to configure a Vimeo account ? (y/N) :\n', function(answer) {
        if (answer === 'y') vimeoConf = {};
        callback(null);
      });
    },
    function(callback) {
      if (!vimeoConf) return callback();
      rl.question('Enter Vimeo Web Service client id (available in your Vimeo account) :\n', function(answer) {
        vimeoConf.clientId = answer;
        callback();
      });
    },
    function(callback) {
      if (!vimeoConf) return callback();
      rl.question('Enter Vimeo Web Service client secret (available in your Vimeo account) :\n', function(answer) {
        vimeoConf.clientSecret = answer;
        callback();
      });
    },
    function(callback) {
      if (!vimeoConf) return callback();
      rl.question('Enter Vimeo Web Service access token (available in your Vimeo account) :\n', function(answer) {
        vimeoConf.accessToken = answer;
        callback();
      });
    },
    function(callback) {
      rl.question('Do you want to configure a Youtube account ? (y/N) :\n', function(answer) {
        if (answer === 'y') {
          youtubeConf = {
            uploadMethod: 'uploadResumable',
            googleOAuth: {},
            privacy: 'unlisted'
          };
        }
        callback();
      });
    },
    function(callback) {
      if (!youtubeConf) return callback();
      rl.question('Enter Youtube API client id (available in your Google Developper Console) :\n', function(answer) {
        youtubeConf.googleOAuth.clientId = answer;
        callback();
      });
    },
    function(callback) {
      if (!youtubeConf) return callback();
      rl.question('Enter Youtube API client secret (available in your Google Developper Console) :\n',
      function(answer) {
        youtubeConf.googleOAuth.clientSecret = answer;
        callback();
      });
    },
    function(callback) {
      if (!youtubeConf) return callback();
      rl.question('Enter Youtube redirect url (available in your Google Developper Console) :\n',
      function(answer) {
        youtubeConf.googleOAuth.redirectUrl = answer;
        callback();
      });
    },
    function(callback) {
      if (!youtubeConf) return callback();
      rl.question('Do you want to overwrite Youtube resumable upload by classic upload ? (y/N) :\n', function(answer) {
        if (answer === 'y') youtubeConf.uploadMethod = 'uploadClassic';
        callback();
      });
    },
    function(callback) {
      if (!youtubeConf) return callback();
      rl.question(
        'Which Youtube privacy mode will be used ? (0:unlisted -default- , 1:private, 2:public) :\n',
        function(answer) {
          if (answer === '1') youtubeConf.privacy = 'private';
          if (answer === '2') youtubeConf.privacy = 'public';
          callback();
        }
      );
    },
    function(callback) {
      rl.question('Do you want to configure a Wowza account ? (y/N) :\n', function(answer) {
        if (answer === 'y') wowzaConf = {
          protocol: 'sftp',
          port: '22'
        };
        callback(null);
      });
    },
    function(callback) {
      if (!wowzaConf) return callback();
      rl.question('Enter Wowza file transfert protocol (0:sftp -default-, 1:ftp):\n', function(answer) {
        if (answer && answer === '1') wowzaConf.protocol = 'ftp';
        callback();
      });
    },
    function(callback) {
      if (!wowzaConf) return callback();
      rl.question('Enter Wowza file transfert port (let empty to set port acccording to protocol):\n',
      function(answer) {
        if (answer) wowzaConf.port = answer;
        else if (wowzaConf.protocol == 'ftp') wowzaConf.port = '21';
        callback();
      });
    },
    function(callback) {
      if (!wowzaConf) return callback();
      rl.question('Enter ftp/sftp user login:\n',
      function(answer) {
        wowzaConf.user = answer;
        callback();
      });
    },
    function(callback) {
      if (!wowzaConf) return callback();
      rl.question('Enter ftp/sftp user password:\n',
      function(answer) {
        wowzaConf.pwd = answer;
        callback();
      });
    },
    function(callback) {
      if (!wowzaConf) return callback();
      rl.question('Enter content path (path configured in wowza vod application relative to user - ' +
        'Ex: /video/ for <USER_DIR>/video/):\n',
      function(answer) {
        wowzaConf.vodFilePath = answer;
        callback();
      });
    },
    function(callback) {
      if (!wowzaConf) return callback();
      rl.question('Enter wowza streaming path (access path of Wowza streaming application - Ex: http://<WOWZA-IP>:1935/vod):\n',
      function(answer) {
        wowzaConf.streamPath = answer;
        callback();
      });
    }
  ],
  function(error, results) {
    if (error) {
      process.stdout.write(error.message);
      callback();
    } else {
      var conf = {};
      if (vimeoConf) conf.vimeo = vimeoConf;
      if (youtubeConf) conf.youtube = youtubeConf;
      if (wowzaConf) conf.wowza = wowzaConf;
      fs.writeFile(confFile, JSON.stringify(conf, null, '\t'), {encoding: 'utf8'}, callback);
    }
  });
}

/**
 * Creates watcher configuration file if it does not exist.
 */
function createWatcherConf(callback) {
  var videoPlatformConf = require(path.join(confDir, 'videoPlatformConf.json'));
  var confFile = path.join(confDir, 'watcherConf.json');
  var conf = {hotFolders: []};

  async.series([
    function(callback) {
      fs.exists(confFile, function(exists) {
        if (exists)
          callback(new Error(confFile + ' already exists\n'));
        else
          callback();
      });
    },
    function(callback) {
      if (!videoPlatformConf.vimeo) return callback();
      var defaultPath = path.join(os.tmpdir(), 'openveo', 'publish', 'hotFolder', 'vimeo');
      rl.question('Enter Vimeo hot folder path to listen to (default: ' + defaultPath + ') :\n', function(answer) {
        conf.hotFolders.push({
          type: 'vimeo',
          path: (answer || defaultPath).replace(/\\/g, '/')
        });
        callback();
      });
    },
    function(callback) {
      if (!videoPlatformConf.youtube) return callback();
      var defaultPath = path.join(os.tmpdir(), 'openveo', 'publish', 'hotFolder', 'youtube');
      rl.question('Enter Youtube hot folder path to listen to (default: ' + defaultPath + ') :\n', function(answer) {
        conf.hotFolders.push({
          type: 'youtube',
          path: (answer || defaultPath).replace(/\\/g, '/')
        });
        callback();
      });
    },
    function(callback) {
      if (!videoPlatformConf.wowza) return callback();
      var defaultPath = path.join(os.tmpdir(), 'openveo', 'publish', 'hotFolder', 'wowza');
      rl.question('Enter Wowza hot folder path to listen to (default: ' + defaultPath + ') :\n', function(answer) {
        conf.hotFolders.push({
          type: 'wowza',
          path: (answer || defaultPath).replace(/\\/g, '/')
        });
        callback();
      });
    }
  ], function(error, results) {
    if (error) {
      process.stdout.write(error.message);
      callback();
    } else
      fs.writeFile(confFile, JSON.stringify(conf, null, '\t'), {encoding: 'utf8'}, callback);
  });
}

// Launch installation
async.series([
  createConfDir,
  createConf,
  createVideoTmpDir,
  createLoggerConf,
  createVideoPlatformConf,
  createWatcherConf,
  createHotFolder
], function(error, results) {
  if (error)
    throw error;
  else {
    process.stdout.write('Installation complete');
    exit();
  }
});
