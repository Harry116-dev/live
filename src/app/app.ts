import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { ZegoExpressEngine } from 'zego-express-engine-webrtc';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,CommonModule,FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('live');

  constructor(public http: HttpClient) { }
  appID: number = 1042883316;
  server: string = 'wss://webliveroom1042883316-api.coolzcloud.com/ws';

  // appID: number = 449016883;
  // server: string = 'wss://webliveroom449016883-api.coolzcloud.com/ws';



  tokenUrl: string = 'https://7a24b3c5cdf5.ngrok-free.app/api';
  userID: any = "";
  roomID: string = '';
  token: string = '04AAAAAGU3Z08AEDY5NzBhN2hjaGNlajVrYXUA0HeXZRcsPF/WYAE7I1IHRswrlVwVo6j6wNYIAn60jupNLdSpjhzZo9KJLEYOf/I24tPNhFVJDqUS1YErV2QVrcewvOo+OON6XyJkhoNT7+WMNKhrQ+4NmCB0RUr1HdZ/HUaVeXCTF5yzidtrNybWuXBfH6xYNyuqedyA2wBZztvQl+1JKndynA5PnM9GdYyToTQ6lnpVvyBLvL2fH0luM2v8psw+Gd0JQ7bYm6tdqJInJZ+i2zSKUYIEFfcZNGH5ZewUBg17Zt7zvZdZ5z7BfCc=';
  streamID: string = '';
  playStreamID: string = '';
  zg: any = null;
  localStream: any = null;
  remoteStream: any = null;
  isLogin: boolean = false;
  videoCodec: string = localStorage.getItem('VideoCodec') === 'H.264' ? 'H264' : 'VP8'

  createSuccessSvgStatus: Boolean = false;
  connectStatus: string = 'DISCONNECTED';
  checkSystemRequireStatus: string = "";
  audioDeviceList: any[] = [];
  videoDeviceList: any[] = [];
  microphoneDevicesVal: string | number = "";
  cameraDevicesVal: string = "";
  cameraCheckStatus: boolean = true;
  microphoneCheckStatus: boolean = true;
  publishStreamStatus: boolean = false;
  mirrorVal: string = "none";
  playStreamStatus: boolean = false;
  videoCheckStatus: boolean = true;
  audioCheckStatus: boolean = false;
  publishInfoStreamID: string = "";
  playInfoStreamID: string = "";
  switchRoom:any = "";

  async enumDevices() {
    const any = await this.zg.enumDevices();
    this.audioDeviceList = any &&
      any.microphones.map((item: any, index: number) => {
        if (!item.deviceName) {
          item.deviceName = 'microphone' + index;
        }
        console.log('microphone: ' + item.deviceName);
        return item;
      });
    this.audioDeviceList.push({ deviceID: '0', deviceName: '禁止' });
    this.microphoneDevicesVal = this.audioDeviceList[0].deviceID;
    this.videoDeviceList = any &&
      any.cameras.map((item: any, index: number) => {
        if (!item.deviceName) {
          item.deviceName = 'camera' + index;
        }
        console.log('camera: ' + item.deviceName);
        return item;
      });
    this.videoDeviceList.push({ deviceID: '0', deviceName: '禁止' });
    this.cameraDevicesVal = this.videoDeviceList[0].deviceID;
  }
  // initEvent() {
  //   this.zg.on('roomStateUpdate', (roomId: string, state: string) => {
  //     if (state === 'CONNECTED') {
  //       this.connectStatus = 'CONNECTED';
  //     }
  //     if (state === 'DISCONNECTED') {
  //       this.connectStatus = 'DISCONNECTED';
  //     }
  //   })

  //   this.zg.on('publisherStateUpdate', (result: any) => {
  //     if (result.state === 'PUBLISHING') {
  //       this.publishInfoStreamID = result.streamID;
  //     } else if (result.state === 'NO_PUBLISH') {
  //       this.publishInfoStreamID = "";
  //     }
  //   });

  //   this.zg.on('playerStateUpdate', (result: any) => {
  //     if (result.state === 'PLAYING') {
  //       this.playInfoStreamID = result.streamID;
  //     } else if (result.state === 'NO_PLAY') {
  //       this.playInfoStreamID = "";
  //     }
  //   });
  // }



   initEvent() {
    /* ---------- ROOM ---------- */
    this.zg.on('roomStateUpdate', (roomId: string, state: string) => {
      console.log('[roomStateUpdate]', roomId, state);
      this.connectStatus = state;
    });

    /* ---------- PUBLISHER ---------- */
    this.zg.on('publisherStateUpdate', (result: any) => {
      console.log('[publisherStateUpdate]', result);
      if (result.state === 'PUBLISHING') {
        this.streamID = result.streamID;
      } else if (result.state === 'NO_PUBLISH') {
        this.streamID = '';
        this.publishStreamStatus = false;
      }
    });

    /* ---------- PLAYER ---------- */
    this.zg.on('playerStateUpdate', (result: any) => {
      console.log('[playerStateUpdate]', result);
      if (result.state === 'PLAYING') {
        this.playStreamID = result.streamID;
      } else if (result.state === 'NO_PLAY') {
        this.playStreamID = '';
        this.playStreamStatus = false;
        this.remoteStream = null;
      }
    });

    /* ========== ROOM STREAM UPDATE (Viewer) ========== */
    this.zg.on('roomStreamUpdate', async (roomID:any, updateType:any, streamList:any) => {
      if (updateType === 'ADD') {
        for (const stream of streamList) {
          if (this.remoteStream!=null) return; // prevent duplicate play
          try {
            this.playStreamID = stream.streamID;
            this.remoteStream = await this.zg.startPlayingStream(stream.streamID, {
              video: true,
              audio: true
            });
              const video = document.getElementById('playVideo') as HTMLVideoElement;
              video.srcObject = this.remoteStream;
              video.playsInline = true;


            this.playStreamStatus = true;
            console.log('Viewer playing stream:', stream.streamID);
          } catch (err) {
            console.error('Viewer play failed', err);
          }
        }
      }

      if (updateType === 'DELETE') {
        for (const stream of streamList) {
          console.log('Stopping stream:', stream.streamID);
          this.zg.stopPlayingStream(stream.streamID);
          this.clearRemoteStream();
          this.playStreamID = '';
          this.playStreamStatus = false;
        }
      }
    });
  }



  getAppInfo() {
    let appID = this.appID; // 请从官网控制台获取对应的appID Please obtain the corresponding appid from the official website console
    let server = this.server; // 请从官网控制台获取对应的server地址，否则可能登录失败 Please obtain the corresponding server address from the console on the official website, otherwise the login may fail
    // var baseURL = window.location.href.match(/.*\/Examples/)[0]
    // get local appID and server
    let appInfo: any = {
      appID,
      server
    }
    if (!appID || !server) {
      try {
        const appInfoStr = localStorage.getItem("app_info") as string;
        const parseAppInfo = JSON.parse(appInfoStr)
        appInfo = parseAppInfo || appInfo
      } catch (error) {
        localStorage.removeItem("app_info")
      }
      if (!appInfo.appID || !appInfo.server) {
        alert("Need to set appID and server url!")
        // window.location.href = `${baseURL}/DebugAndConfig/InitSettings/index.html${location.search}`
      }
    } else {
      localStorage.setItem("app_info", JSON.stringify({
        appID,
        server
      }))
    }
    this.appID = appInfo.appID;
    this.server = appInfo.server;
  }


  ngOnInit(){
    this.createZegoExpressEngineOption();
    this.checkSystemRequire();
  }
  // Step1 Create ZegoExpressEngine
  createZegoExpressEngine() {
    this.getAppInfo();
    this.zg = new ZegoExpressEngine(this.appID, this.server);
  }
  // Step2 Check system requirements
  async checkSystemRequirements() {
    console.log('sdk version is', this.zg.getVersion());
    try {
      const result = await this.zg.checkSystemRequirements();

      console.warn('checkSystemRequirements ', result);

      if (!result.webRTC) {
        console.error('browser is not support webrtc!!');
        return false;
      } else if (!result.videoCodec.H264 && !result.videoCodec.VP8) {
        console.error('browser is not support H264 and VP8');
        return false;
      } else if (!result.camera && !result.microphone) {
        console.error('camera and microphones not allowed to use');
        return false;
      } else if (result.videoCodec.VP8) {
        if (!result.screenSharing) console.warn('browser is not support screenSharing');
      } else {
        console.log('不支持VP8，请前往混流转码测试');
      }
      return true;
    } catch (err) {
      console.error('checkSystemRequirements', err);
      return false;
    }
  }
  //Step3 Login room
  async loginRoom(roomId: string, userId: string, userName: string, token: string) {
    return this.zg.loginRoom(roomId, token, {
      userID: userId,
      userName
    })
  }
  // Step4 Start Publishing Stream
  async startPublishingStream(streamId: string, config: any) {
    try {
      this.localStream = await this.zg.createZegoStream(config);
      this.zg.startPublishingStream(streamId, this.localStream, { videoCodec: this.videoCodec });
      this.localStream.playVideo(document.querySelector("#localVideo"))
      return true;
    } catch (err) {
      console.error(err)
      return false;
    }
  }
  // Step5 Start Play Stream
  async startPlayingStream(streamId: string, options = {}) {
    try {
      this.remoteStream = await this.zg.startPlayingStream(streamId, options);
      return true;
    } catch (err) {
      return false;
    }
  }
  // Logout room
  logoutRoom(roomId: string) {
    this.zg.logoutRoom(roomId);
  }
  // Stop Publishing Stream
  async stopPublishingStream(streamId: string) {
    this.zg.stopPublishingStream(streamId);
  }
  // Stop Play Stream
  async stopPlayingStream(streamId: string) {
    this.zg.stopPlayingStream(streamId);
  }
  clearStream() {
    this.localStream && this.zg.destroyStream(this.localStream);
    //   this.$refs['publishVideo'].srcObject = null;
    this.localStream = null;
    this.remoteStream && this.zg.destroyStream(this.remoteStream);
    //   this.$refs['playVideo'].srcObject = null;
    this.remoteStream = null;
  }
  changeAudioDevices() {
    if (!this.zg || !this.localStream) {
      return
    }
    const isMicrophoneMuted = this.zg.isMicrophoneMuted();
    if (!isNaN(this.microphoneDevicesVal as number) && !isMicrophoneMuted) {
      this.zg.muteMicrophone(true);
    } else {
      this.zg.muteMicrophone(false);
      this.zg.useAudioDevice(this.localStream, this.microphoneDevicesVal);
    }
  }
  // ==============================================================
  // This part of the code binds the button click event
  // ==============================================================
  createZegoExpressEngineOption(): void {
    this.createZegoExpressEngine();
    this.createSuccessSvgStatus = true;
    this.initEvent();
  }
  async checkSystemRequire() {
    if (!this.zg) return alert('you should create zegoExpressEngine');
    const result = await this.checkSystemRequirements();
    if (result) {
      this.checkSystemRequireStatus = 'SUCCESS';
      this.enumDevices();
    } else {
      this.checkSystemRequireStatus = 'ERROR';
    }
  }
  async loginRoomOption() {
    if (!this.zg) return alert('you should create zegoExpressEngine');
    try {
      this.isLogin = true;

      // 🔹 1. Hit token API
      const response: any = await this.http
        .get(`${this.tokenUrl}/${this.roomID}/${this.userID}`)
        .toPromise();

      this.token = response?.token;

      if (!this.token) {
        throw new Error('Token not received from server');
      }


      await this.loginRoom(this.roomID, this.userID, this.userID, this.token);
    } catch (err) {
      this.isLogin = false;
      console.log(err);
    }
  }
  async startPublishing() {
    const flag = await this.startPublishingStream.call(this, this.streamID, {
      camera: {
        video: this.cameraCheckStatus ? {
          input: this.cameraDevicesVal
        } : false,
        audio: this.microphoneCheckStatus ? {
          input: this.microphoneDevicesVal
        } : false,
      }
    })
    if (flag) {
      this.publishStreamStatus = true;
    }
  }
  async startPlaying() {
    const flag = await this.startPlayingStream(this.playStreamID, {
      video: this.videoCheckStatus,
      audio: this.audioCheckStatus
    });
    if (flag) {
      this.playStreamStatus = true;
    }
  }
  async reset() {
    if (!this.zg) {
      return
    }
    await this.stopPublishingStream(this.streamID);
    await this.stopPlayingStream(this.playStreamID);
    if (this.isLogin) {
      this.isLogin = false;
      this.logoutRoom(this.roomID);
    }
    this.clearStream();
    this.zg = null;
    this.playStreamStatus = false;
    this.publishStreamStatus = false;
    this.createSuccessSvgStatus = false;
    this.checkSystemRequireStatus = '';
    this.audioCheckStatus = false;
  }



    /* ==================== VIEWER ==================== */
  async loginViewer(roomID: string) {
    if (!this.zg) return;

    this.roomID = roomID;

    const response: any = await this.http.get(`${this.tokenUrl}/${roomID}/${this.userID}`).toPromise();
    this.token = response.token;

    await this.zg.loginRoom(roomID, this.token, {
      userID: this.userID,
      userName: this.userID
    });

    this.isLogin = true;

    this.startPlaying();
  }

  async switchRoomViewer(newRoomID: string) {
    if (!this.zg) return;

    // Stop current stream
    if (this.playStreamID) {
      this.zg.stopPlayingStream(this.playStreamID);
    }
    this.clearRemoteStream();
    this.playStreamID = '';
    this.playStreamStatus = false;

    // Logout old room
    if (this.isLogin && this.roomID) {
      await this.zg.logoutRoom(this.roomID);
    }
    this.isLogin = false;

    // Login new room
    await this.loginViewer(newRoomID);
  }

  clearRemoteStream() {
    if (this.remoteStream) {
      this.zg.destroyStream(this.remoteStream);
      this.remoteStream = null;
    }
  }
}


