/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
 */

function takePicture(success, error, opts) {
    if (opts && opts[2] === 1) {
        capture(success, error);
    } else {
        var input = document.createElement('input');
        input.type = 'file';
        input.name = 'files[]';

        input.onchange = function(inputEvent) {
            var canvas = document.createElement('canvas');

            var reader = new FileReader();
            reader.onload = function(readerEvent) {
                input.parentNode.removeChild(input);

                var imageData = readerEvent.target.result;

                return success(imageData.substr(imageData.indexOf(',') + 1));
            }

            reader.readAsDataURL(inputEvent.target.files[0]);
        };

        document.body.appendChild(input);
    }
};

var randomString = function(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for(var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

function b64toBlob(b64Data, contentType, sliceSize) {
    contentType = contentType || '';
    sliceSize = sliceSize || 512;

    var byteCharacters = atob(b64Data);
    var byteArrays = [];

    for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        var slice = byteCharacters.slice(offset, offset + sliceSize);

        var byteNumbers = new Array(slice.length);
        for (var i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        var byteArray = new Uint8Array(byteNumbers);

        byteArrays.push(byteArray);
    }

    var blob = new Blob(byteArrays, {type: contentType});
    return blob;
}


function saveImg(imgB64, callback){
    window.requestFileSystem(LocalFileSystem.TEMPORARY, imgB64.length, function (fs) {

        fs.root.getFile(randomString(16) +".jpg", {create: true, exclusive: false}, function (entry) {

            entry.createWriter(function (writer) {
                writer.onwrite = function (e) {
                    callback(entry.toURL());
                };

                writer.write(b64toBlob(imgB64));
            }, function (err) {
                console.log(err);
            })

        }, function (err) {
            console.log(err);
        })
    }, function (err) {
        console.log(err);
    })
}

function capture(success, errorCallback) {
    var localMediaStream;

    var video = document.createElement('video');
    var button = document.createElement('button');

    video.width = 320;
    video.height = 240;
    button.innerHTML = 'Capture!';

    video.style.position = "absolute";
    video.style.zIndex = 100;

    button.style.position = "absolute";
    button.style.zIndex = 100;
    button.style.top = "250px";

    button.onclick = function() {
        // create a canvas and capture a frame from video stream
        var canvas = document.createElement('canvas');
        canvas.getContext('2d').drawImage(video, 0, 0, 320, 240);

        // convert image stored in canvas to base64 encoded image
        var imageData = canvas.toDataURL('img/png');
        imageData = imageData.replace('data:image/png;base64,', '');

        // stop video stream, remove video and button
        localMediaStream.stop();
        video.parentNode.removeChild(video);
        button.parentNode.removeChild(button);

        return saveImg(imageData, success);

    };

    navigator.getUserMedia = navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia;

    var successCallback = function(stream) {
        localMediaStream = stream;
        video.src = window.URL.createObjectURL(localMediaStream);
        video.play();

        document.body.appendChild(video);
        document.body.appendChild(button);
    }

    if (navigator.getUserMedia) {
        navigator.getUserMedia({video: true, audio: true}, successCallback, errorCallback);
    } else {
        alert('Browser does not support camera :(');
    }
}

module.exports = {
    takePicture: takePicture,
    cleanup: function(){}
};

require("cordova/exec/proxy").add("Camera",module.exports);
