console.log("agora sdk version: " + AgoraRTC.VERSION + " compatible: " + AgoraRTC.checkSystemRequirements());

var Toast = {
  info: function (msg) {
    //Toastify({
      //text: msg,
      //backgroundColor: "#3498db"
    //}).showToast();
  },
  notice: function (msg) {
    //Toastify({
      //text: msg,
      //backgroundColor: "#07bc0c"
    //}).showToast();
  },
  error: function (msg) {
    //Toastify({
      //text: msg,
      //backgroundColor: "#e74c3c"
    //}).showToast();
  }
}

function validator(formData, fields) {
  var keys = Object.keys(formData);
  for (let key in keys) {
    var keyName = keys[key];
    if (fields.indexOf(keyName) != -1) {
      if (!formData[keyName]) {
        Toast.error("Please Enter " + keyName);
        return false;
      }
    }
  }
  return true;
}

function serializeFormData() {
  var formData = $("#form").serializeArray();
  let obj = {}
  for (var item in formData) {
    var key = formData[item].name;
    var val = formData[item].value;
    obj[key] = val;
  }
//join(rtc, {"appID":"678731aa56674937a8fcc4fabb6c9115","channel":"123","Token":"","uid":"","cameraId":"f95c9ca184b68a67b6558f31923652d1bed00c00007f01b47d50bd5094be3572","microphoneId":"default","mode":"live","codec":"h264"})
  obj["appID"] = "678731aa56674937a8fcc4fabb6c9115"
  return obj;
}

function addView (id) {
  if (!$("#" + id)[0]) {
    $("<div/>", {
      id: "remote_video_" + id,
      class: "video-view",
      style: "width: 150px;height:100px; bottom: 0 ; position: absolute",
    }).appendTo("#video");
  }
}

function removeView (id) {
  if ($("#remote_video_" + id)[0]) {
    $("#remote_video_"+id).remove();
  }
}
