recognition = new webkitSpeechRecognition();
recognition.continuous = true;
function startTranscribe() {
    recognition.onstart = function () {
        console.info("started recognition");
    };
    recognition.onerror = function (event) {
        console.error(event.error);
    };
    recognition.onresult = function (event) {
        console.log(event);
        var final_transcript = "";
        if (typeof event.results == "undefined") {
            recognition.onend = null;
            recognition.stop();
            upgrade();
            return;
        }
        for (var i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                final_transcript += event.results[i][0].transcript;
            }
            else {
                interim_transcript += event.results[i][0].transcript;
            }
        }
        if (window.chatChannel == undefined)
            return;
        console.log("sending data to chat channel " + final_transcript);
        window.chatChannel.messageChannelSend(JSON.stringify({
            resultIndex: event.resultIndex,
            final_transcript: final_transcript,
            clientId: rtc.client.clientId,
        }));
    };
    recognition.start();
}


function signalInit(channel_id) {
    signalClient = Signal("678731aa56674937a8fcc4fabb6c9115")
    session = signalClient.login(channel_id, "_no_need_token");

    session.onLoginSuccess = function (uid) {
      var channel = session.channelJoin("chat");
      console.log("login success");
      channel.onChannelJoined = function () {
      console.log("chall joined success");
        window.chatChannel = channel;
        window.chatChannel.messageChannelSend(JSON.stringify({
            init: true,
        }));
        channel.onMessageChannelReceive = function (account, uid, msg) {
            console.log("received data to chat channel " + msg);
            console.log(account, uid, msg);
            const payload = JSON.parse(msg);
            window.messages.push({text: payload.final_transcript, clientId: payload.clientId}) 

            renderChat()
            //addTranscribe(payload.resultIndex, account, payload.interim_transcript || payload.final_transcript, account === name);
        };
      };
    };

    session.onLogout = function (ecode) {
        /* Set the onLogout callback. */
    };
}

function renderChat() {
  final_html = ""
  for (message of window.messages) {
    console.log(message);
    if(message.clientId == rtc.client.clientId){
      html = '<div class="d-flex justify-content-end mb-4"> <div class="img_cont_msg"> </div> <div class="msg_cotainer_send"> '+ message.text + '  <span class="msg_time">8:40 AM, Today</span> </div> </div>'
    }else{
      html = '<div class="d-flex justify-content-start mb-4"> <div class="img_cont_msg"> </div> <div class="msg_cotainer"> '+message.text+' <span class="msg_time">8:40 AM, Today</span> </div> </div>'
    }
    final_html = final_html + html
  }
  $(".card-body.msg_card_body").html(final_html)
}
function startrecording(){
  v = $("#video video");
  try {
    mixer = new MultiStreamsMixer([v[0].captureStream(),v[1].captureStream()]);
  } catch (e) {
    /* handle error */
    console.log("FUCKKKKK");
  }
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
          window.messages = []
          startrecording();
          startTranscribe();
          signalInit(rtc.client.clientId)
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
            var urlobj =  window.URL.createObjectURL(blob);
            //invokeSaveAsDialog(blob);
            $("#recording").show();
            $("#recording").attr("src" , urlobj);
            var wavesurfer = WaveSurfer.create({
              container: '#waveform',
              waveColor: 'violet',
              progressColor: 'purple'
            });
            wavesurfer.load(urlobj);
          });
        })
      })
//join(rtc, {"appID":"678731aa56674937a8fcc4fabb6c9115","channel":"123","Token":"","uid":"","cameraId":"f95c9ca184b68a67b6558f31923652d1bed00c00007f01b47d50bd5094be3572","microphoneId":"default","mode":"live","codec":"h264"})
