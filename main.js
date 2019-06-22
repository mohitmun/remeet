function startrecording(){
  v = document.getElementsByTagName("video");
  let mixer = new MultiStreamsMixer([v[0].captureStream(),v[1].captureStream()]);
  mixer.startDrawingFrames();
  let recorder = RecordRTC(mixer.getMixedStream(), {
    type: 'video'
  });
  recorder.startRecording();
  window.recorder = recorder;
}
      console.log("agora sdk version: " + AgoraRTC.VERSION + " compatible: " + AgoraRTC.checkSystemRequirements());
      function getDevices (next) {
        AgoraRTC.getDevices(function (items) {
          items.filter(function (item) {
            return ['audioinput', 'videoinput'].indexOf(item.kind) !== -1
          })
          .map(function (item) {
            return {
            name: item.label,
            value: item.deviceId,
            kind: item.kind,
            }
          });
          var videos = [];
          var audios = [];
          for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if ('videoinput' == item.kind) {
              var name = item.label;
              var value = item.deviceId;
              if (!name) {
                name = "camera-" + videos.length;
              }
              videos.push({
                name: name,
                value: value,
                kidn: item.kind
              });
            }
            if ('audioinput' == item.kind) {
              var name = item.label;
              var value = item.deviceId;
              if (!name) {
                name = "microphone-" + audios.length;
              }
              audios.push({
                name: name,
                value: value,
                kidn: item.kind
              });
            }
          }
          next({videos: videos, audios: audios});
        });
      }
  
      var rtc = {
        client: null,
        joined: false,
        published: false,
        localStream: null,
        remoteStreams: [],
        params: {}
      };
  
      function handleEvents (rtc) {
        // Occurs when an error message is reported and requires error handling.
        rtc.client.on("error", (err) => {
          console.log(err)
        })
        // Occurs when the peer user leaves the channel; for example, the peer user calls Client.leave.
        rtc.client.on("peer-leave", function (evt) {
          var id = evt.uid;
          console.log("id", evt);
          if (id != rtc.params.uid) {
            removeView(id);
          }
          Toast.notice("peer leave")
          console.log('peer-leave', id);
        })
        // Occurs when the local stream is published.
        rtc.client.on("stream-published", function (evt) {
          Toast.notice("stream published success")
          console.log("stream-published");
        })
        // Occurs when the remote stream is added.
        rtc.client.on("stream-added", function (evt) {  
          var remoteStream = evt.stream;
          var id = remoteStream.getId();
          Toast.info("stream-added uid: " + id)
          if (id !== rtc.params.uid) {
            rtc.client.subscribe(remoteStream, function (err) {
              console.log("stream subscribe failed", err);
            })
          }
          console.log('stream-added remote-uid: ', id);
        });
        // Occurs when a user subscribes to a remote stream.
        rtc.client.on("stream-subscribed", function (evt) {
          var remoteStream = evt.stream;
          var id = remoteStream.getId();
          rtc.remoteStreams.push(remoteStream);
          addView(id);
          remoteStream.play("remote_video_" + id);
          Toast.info('stream-subscribed remote-uid: ' + id);
          startrecording();
          console.log('stream-subscribed remote-uid: ', id);
        })
        // Occurs when the remote stream is removed; for example, a peer user calls Client.unpublish.
        rtc.client.on("stream-removed", function (evt) {
          var remoteStream = evt.stream;
          var id = remoteStream.getId();
          Toast.info("stream-removed uid: " + id)
          remoteStream.stop("remote_video_" + id);
          rtc.remoteStreams = rtc.remoteStreams.filter(function (stream) {
            return stream.getId() !== id
          })
          removeView(id);
          console.log('stream-removed remote-uid: ', id);
        })
        rtc.client.on("onTokenPrivilegeWillExpire", function(){
          // After requesting a new token
          // rtc.client.renewToken(token);
          Toast.info("onTokenPrivilegeWillExpire")
          console.log("onTokenPrivilegeWillExpire")
        });
        rtc.client.on("onTokenPrivilegeDidExpire", function(){
          // After requesting a new token
          // client.renewToken(token);
          Toast.info("onTokenPrivilegeDidExpire")
          console.log("onTokenPrivilegeDidExpire")
        })
      }
  
      function join (rtc, data) {
        if (rtc.joined) {
          Toast.error("Your already joined");
          return;
        }
  
        /**
         * A class defining the properties of the config parameter in the createClient method.
         * Note:
         *    Ensure that you do not leave mode and codec as empty.
         *    Ensure that you set these properties before calling Client.join.
         *  You could find more detail here. https://docs.agora.io/en/Video/API%20Reference/web/interfaces/agorartc.clientconfig.html
        **/
        rtc.client = AgoraRTC.createClient({mode: data.mode, codec: data.codec});
  
        rtc.params = data;
  
        // handle AgoraRTC client event
        handleEvents(rtc);
  
        // init client
        rtc.client.init(data.appID, function () {
          console.log("init success");
  
          /**
           * Joins an AgoraRTC Channel
           * This method joins an AgoraRTC channel.
           * Parameters
           * tokenOrKey: string | null
           *    Low security requirements: Pass null as the parameter value.
           *    High security requirements: Pass the string of the Token or Channel Key as the parameter value. See Use Security Keys for details.
           *  channel: string
           *    A string that provides a unique channel name for the Agora session. The length must be within 64 bytes. Supported character scopes:
           *    26 lowercase English letters a-z
           *    26 uppercase English letters A-Z
           *    10 numbers 0-9
           *    Space
           *    "!", "#", "$", "%", "&", "(", ")", "+", "-", ":", ";", "<", "=", ".", ">", "?", "@", "[", "]", "^", "_", "{", "}", "|", "~", ","
           *  uid: number | string | null
           *    The user ID, an integer or a string, ASCII characters only. Ensure this ID is unique. If you set the uid to null, the server assigns one and returns it in the onSuccess callback.
           *   Note:
           *      All users in the same channel should have the same type (number or string) of uid.
           *      If you use a number as the user ID, it should be a 32-bit unsigned integer with a value ranging from 0 to (232-1).
           *      If you use a string as the user ID, the maximum length is 255 characters.
          **/
          rtc.client.join(data.token ? data.token : null, data.channel, data.uid ? data.uid : null, function (uid) {
            Toast.notice("join channel: " + data.channel + " success, uid: " + uid);
            console.log("join channel: " + data.channel + " success, uid: " + uid);
            rtc.joined = true;
  
            rtc.params.uid = uid;
  
  
            // create local stream
            rtc.localStream = AgoraRTC.createStream({
              streamID: rtc.params.uid,
              audio: true,
              video: true,
              screen: false,
              microphoneId: data.microphoneId,
              cameraId: data.cameraId
            })
  
            // init local stream
            rtc.localStream.init(function () {
              console.log("init local stream success");
              // play stream with html element id "local_stream"
              rtc.localStream.play("local_stream")
  
              // publish local stream
              publish(rtc);
            }, function (err)  {
              Toast.error("stream init failed, please open console see more detail")
              console.error("init local stream failed ", err);
            })
          }, function(err) {
            Toast.error("client join failed, please open console see more detail")
            console.error("client join failed", err)
          })
        }, (err) => {
          Toast.error("client init failed, please open console see more detail")
          console.error(err);
        });
      }
  
      function publish (rtc) {
        if (!rtc.client) {
          Toast.error("Please Join Room First");
          return;
        }
        if (rtc.published) {
          Toast.error("Your already published");
          return;
        }
        var oldState = rtc.published;
  
        // publish localStream
        rtc.client.publish(rtc.localStream, function (err) {
          rtc.published = oldState;
          console.log("publish failed");
          Toast.error("publish failed")
          console.error(err);
        })
        Toast.info("publish")
        rtc.published = true
      }
  
      function unpublish (rtc) {
        if (!rtc.client) {
          Toast.error("Please Join Room First");
          return;
        }
        if (!rtc.published) {
          Toast.error("Your didn't publish");
          return;
        }
        var oldState = rtc.published;
        rtc.client.unpublish(rtc.localStream, function (err) {
          rtc.published = oldState;
          console.log("unpublish failed");
          Toast.error("unpublish failed");
          console.error(err);
        })
        Toast.info("unpublish")
        rtc.published = false;
      }
  
      function leave (rtc) {
        if (!rtc.client) {
          Toast.error("Please Join First!");
          return;
        }
        if (!rtc.joined) {
          Toast.error("You are not in channel");
          return;
        }
        /**
         * Leaves an AgoraRTC Channel
         * This method enables a user to leave a channel.
         **/
        rtc.client.leave(function () {
          // stop stream
          rtc.localStream.stop();
          // close stream
          rtc.localStream.close();
          while (rtc.remoteStreams.length > 0) {
            var stream = rtc.remoteStreams.shift();
            var id = stream.getId();
            stream.stop();
            removeView(id);
          }
          rtc.localStream = null;
          rtc.remoteStreams = [];
          rtc.client = null;
          console.log("client leaves channel success");
          rtc.published = false;
          rtc.joined = false;
          Toast.notice("leave success");
        }, function (err) {
          console.log("channel leave failed");
          Toast.error("leave success");
          console.error(err);
        })
      }
  
      $(function () {
        $('body').bootstrapMaterialDesign();
        $("#settings").on("click", function (e) {
          e.preventDefault();
          $("#settings").toggleClass("btn-raised");
          $('#setting-collapse').collapse();
        });

        getDevices(function (devices) {
          devices.audios.forEach(function (audio) {
            $('<option/>', {
              value: audio.value,
              text: audio.name,
            }).appendTo("#microphoneId");
          })
          devices.videos.forEach(function (video) {
            $('<option/>', {
              value: video.value,
              text: video.name,
            }).appendTo("#cameraId");
          })
        })
  
        var fields = ['appID', 'channel'];
  
        $("#join").on("click", function (e) {
          e.preventDefault();
          console.log("create")
          var params = serializeFormData();
          if (validator(params, fields)) {
            console.log("wow");
            console.log(JSON.stringify(params));
            join(rtc, params);
          }
        })
  
        $("#publish").on("click", function (e) {
          e.preventDefault();
          console.log("publish")
          var params = serializeFormData();
          if (validator(params, fields)) {
            publish(rtc);
          }
        });
  
        $("#unpublish").on("click", function (e) {
          e.preventDefault();
          console.log("unpublish")
          var params = serializeFormData();
          if (validator(params, fields)) {
            unpublish(rtc);
          }
        });
  
        $("#leave").on("click", function (e) {
          e.preventDefault();
          console.log("leave")
          var params = serializeFormData();
          if (validator(params, fields)) {
            leave(rtc);
          }
          window.recorder.stopRecording(function() {
            let blob = window.recorder.getBlob();
            //invokeSaveAsDialog(blob);

            $("#recording").attr("src" , window.URL.createObjectURL(blob));
          });
        })
      })
//join(rtc, {"appID":"678731aa56674937a8fcc4fabb6c9115","channel":"123","Token":"","uid":"","cameraId":"f95c9ca184b68a67b6558f31923652d1bed00c00007f01b47d50bd5094be3572","microphoneId":"default","mode":"live","codec":"h264"})
