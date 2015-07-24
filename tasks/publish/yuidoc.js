module.exports = {

  // Publish doc
  publish : {
    "name" : "<%= pkg.name %>",
    "description" : "<%= pkg.description %>",
    "version" : "<%= pkg.version %>",
    "options" : {
      "paths" : "app/server",
      "outdir" : "./doc/openveo-publish",
      "linkNatives" : true,
      "external": {
        "data": [
          {
            "base" : "../../doc/openveo-api/",
            "json" : "./doc/openveo-api/data.json"
          }
        ]
      }
    }
  }
  
};