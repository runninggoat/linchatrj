import React, { Component } from 'react';
import { Layout } from 'antd';
import './App.css';
import COLORS from './colors'
import WxWindow from './WxWindow'

const {
  Header, Footer, Content,
} = Layout;

const qrCodeBase = 'https://login.weixin.qq.com/qrcode/'

class App extends Component {

  state = {
    loginStage: 0, // 0-null，1-二维码，2-扫描后确认前，3-确认后，4-获得passTick后init前
    uuid: '',
    avatar: '',
    ticket: '',
    scan: '',
    canAction: true,
    loopId: 0,
    // 关键的wxinit参数
    token: {},
    cookies: '',
    deviceId: '',
    // 下面是登陆成功后wxinit的信息
    ContactList: [],
    MPSubscribeMsgList: [],
    SyncKey: {},
    User: {},
  }

  componentDidMount() {
    const deviceId = `e${(Math.random() * 10e15).toFixed(0)}`.substring(0, 16)
    this.setState({ deviceId })
    const serializedToken = localStorage.getItem('token')
    const token = JSON.parse(serializedToken)
    console.log('token', token)
    if (token && Object.keys(token).length > 1) {
      console.log('Token cache detected, rehydrate with cache')
      const cookies = localStorage.getItem('cookies')
      this.setState({ token, cookies, loginStage: 4 }, () => {
        // this._wxInit()
        const init = JSON.parse(localStorage.getItem('init'))
        this.setState({ ...init }, () => {
          console.log('User', this.state.User)
        })
      })
    } else {
      console.log('No token cached')
      this._startLoginProcess()
    }
  }

  componentWillUnmount() {
    if (this.state.loopId) clearInterval(this.state.loopId)
  }

  _wxInit = () => {
    const { token, cookies, deviceId } = this.state
    token.cookies = cookies
    token.deviceId = deviceId
    const s = document.cookie.indexOf('csrfToken')
    const csrfToken = document.cookie.substring(s + 10)
    let url = '/wxinit/'
    fetch(url, {
      body: JSON.stringify(token), // must match 'Content-Type' header
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': csrfToken,
      },
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
    }).then(response => {
      console.log(response)
      response.text().then(serializedResp => {
        const resp = JSON.parse(serializedResp)
        console.log(resp)
        const { data } = resp
        const { BaseResponse } = data
        const { Ret } = BaseResponse
        if (Ret >= 1100) {
          // 1100表示未登陆
          // 1101表示还未检测到登陆，清空状态，重新执行登陆操作
          // 1102表示cookie值无效
          // 参考https://blog.csdn.net/qq_16030133/article/details/82121449
          console.log(Ret, 'not login')
          this._startLoginProcess()
        } else if (Ret === 0) {
          // 登陆成功，正确返回数据
          const { ContactList, MPSubscribeMsgList, SyncKey, User } = data
          this.setState({
            ContactList,
            MPSubscribeMsgList,
            User,
            SyncKey,
          })
          const init = {
            ContactList,
            MPSubscribeMsgList,
            User,
            SyncKey,
          }
          localStorage.setItem('init', JSON.stringify(init))
          this._startStatusNotify()
        }
      })
    })
  }

  _startStatusNotify = () => {
    const { token, cookies, deviceId, User } = this.state
    token.cookies = cookies
    token.deviceId = deviceId
    token.userName = User['UserName']
    const s = document.cookie.indexOf('csrfToken')
    const csrfToken = document.cookie.substring(s + 10)
    let url = '/startstatusnotify/'
    fetch(url, {
      body: JSON.stringify(token), // must match 'Content-Type' header
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': csrfToken,
      },
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
    }).then(response => {
      console.log(response)
      response.text().then(serializedResp => {
        console.log(serializedResp)
      })
    })
  }

  _queryFullContactList = () => {}

  _startLoginProcess = () => {
    console.log('Start login process...')
    // 初始化状态
    if (this.state.loopId) clearInterval(this.state.loopId)
    localStorage.setItem('token', null)
    localStorage.setItem('cookies', null)
    this.setState({
      loginStage: 0,
      uuid: '',
      avatar: '',
      ticket: '',
      scan: '',
      canAction: true,
      loopId: 0,
      token: {},
      cookies: '',
    })
    this._requestQRCode()
    // 每秒钟循环，等待用户扫描二维码
    const loopId = setInterval(() => {
      this._waitForScan()
    }, 1000)
    this.setState({ loopId })
  }

  _requestQRCode = () => {
    let url = '/getuuid/'
    fetch(url).then(response => {
      // console.log(response)
      response.text().then(serializedResp => {
        const resp = JSON.parse(serializedResp)
        console.log(resp)
        const b = (String.fromCharCode.apply(null, resp.data.data)).toString()
        console.log(b)
        const uuid = this._extractUuid(b)
        this.setState({ uuid, loginStage: 1 })
      })
    })
  }

  _extractUuid = t => {
    let s = t.indexOf('uuid')
    let i = t.indexOf('"', s + 1)
    let j = t.indexOf('"', i + 1)
    return t.substring(i + 1, j)
  }

  _waitForScan = () => {
    const { canAction, uuid, loginStage, loopId } = this.state
    if (loginStage !== 1 && loginStage !== 2) return
    if (!canAction) return
    this.setState({ canAction: false })
    const tip = loginStage > 1 ? 0 : 1
    let url = `/waitforscan/?uuid=${uuid}&tip=${tip}`
    fetch(url).then(response => {
      // console.log(response)
      response.text().then(serializedResp => {
        const resp = JSON.parse(serializedResp)
        console.log(resp)
        const b = (String.fromCharCode.apply(null, resp.data.data)).toString()
        console.log(b)
        const code = this._extractRespCode(b)
        console.log('code', code)
        switch(code) {
          case 201: {
            // 扫描成功
            console.log('201, scanned, need to confirm on phone...')
            const avatar = this._extractAvatar(b)
            this.setState({ canAction: true, loginStage: 2, avatar })
            break
          }
          case 200: {
            // 确认登录
            console.log('200, login success')
            const { ticket, scan } = this._extractTicketScan(b)
            clearInterval(loopId) // 不用再轮询
            this.setState({ canAction: true, loginStage: 3, loopId: 0, ticket, scan })
            this._requestIdentification() // 获取登陆后的公参，用于后面所有接口的访问
            break
          }
          case 408:
          default: {
            // 长时间不扫描二维码导致登陆超时，继续等待或刷新二维码(t.b.c.)
            console.log('408, timeout without scan, query another time...')
            this.setState({ canAction: true })
            break
          }
        }
      })
    })
  }

  _extractRespCode = t => {
    let s = t.indexOf('code')
    let i = t.indexOf('=', s + 1)
    return parseInt(t.substring(i + 1, i + 4))
  }

  _extractAvatar = t => {
    let s = t.indexOf('userAvatar')
    let i = t.indexOf('\'', s + 1)
    let j = t.indexOf('\'', i + 1)
    return t.substring(i + 1, j)
  }

  _extractTicketScan = t => {
    let s = t.indexOf('ticket')
    let i = t.indexOf('=', s + 1)
    let j = t.indexOf('&', i + 1)
    let ticket = t.substring(i + 1, j)
    s = t.indexOf('scan')
    i = t.indexOf('=', s + 1)
    j = t.indexOf('"', i + 1)
    let scan = t.substring(i + 1, j)
    return { ticket, scan }
  }

  _requestIdentification = () => {
    console.log('request identification...')
    const { uuid, ticket, scan } = this.state
    let url = `/getpassticket/?uuid=${uuid}&ticket=${ticket}&scan=${scan}`
    fetch(url).then(response => {
      // console.log(response)
      response.text().then(serializedResp => {
        const resp = JSON.parse(serializedResp)
        console.log(resp)
        const b = (String.fromCharCode.apply(null, resp.data.data)).toString()
        console.log(b)
        const token = this._extractXML(b)
        const cookiesArr = resp.headers['set-cookie']
        let cookies = ''
        cookiesArr.forEach(cookie => {
          cookies = cookies.concat(`${cookie}; `)
        })
        cookies = cookies.substring(0, cookies.length - 1)
        this.setState({ token, loginStage: 4, cookies }, () => {
          this._wxInit()
        })
        // 缓存得到的用户身份
        localStorage.setItem('token', JSON.stringify(token))
        localStorage.setItem('cookies', JSON.stringify(cookies))
      })
    })
  }

  _extractXML = t => {
    let ret = {}
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(t, 'text/xml')
    console.log('xmlDoc', xmlDoc)
    const errorTags = xmlDoc.getElementsByTagName('error')
    if (errorTags.length < 1) {
      console.log('response', t)
      console.log('response is not correct, cannot find xml doc')
    } else {
      const retCode = xmlDoc.getElementsByTagName('ret')[0].textContent
      const skey = xmlDoc.getElementsByTagName('skey')[0].textContent
      const passTicket = xmlDoc.getElementsByTagName('pass_ticket')[0].textContent
      const wxuin = xmlDoc.getElementsByTagName('wxuin')[0].textContent
      const wxsid = xmlDoc.getElementsByTagName('wxsid')[0].textContent
      console.log(retCode, skey, wxsid, wxuin, passTicket)
      ret = { retCode, skey, wxsid, wxuin, passTicket }
    }
    return ret
  }

  _renderItem = () => {
    const { loginStage, uuid, avatar, token, cookies, User, ContactList, MPSubscribeMsgList, SyncKey } = this.state
    switch(loginStage) {
      case 0: {
        return null
      }
      case 1: {
        return <QRCode uuid={uuid} />
      }
      case 2: {
        return <WXAvatar avatar={avatar} />
      }
      case 3: {
        return <WXProfile token={token} />
      }
      case 4: {
        return <WxWindow token={token} cookies={cookies} User={User} ContactList={ContactList} MPSubscribeMsgList={MPSubscribeMsgList} SyncKey={SyncKey} />
      }
      default: {
        return <div>{'登陆步骤出错！'}</div>
      }
    }
  }

  render() {
    return (
      <div className="App">
        <Layout>
          <Header style={{ backgroundColor: 'transparent', borderWidth: 2, borderColor: COLORS.green, borderStyle: 'solid' }}></Header>
          <Content style={{ padding: 50 }}>
            <div style={{ backgroundColor: COLORS.white, padding: 24, minHeight: 400 }}>
              {this._renderItem()}
            </div>
          </Content>
          <Footer style={{ backgroundColor: 'transparent', borderWidth: 2, borderColor: COLORS.green, borderStyle: 'solid' }}></Footer>
        </Layout>
      </div>
    );
  }
}

export default App;

class QRCode extends Component {

  render() {
    const { uuid = '' } = this.props
    return(
      <div>
        <img src={`${qrCodeBase}${uuid}`} style={{ maxWidth: 300 }} alt='QR Code'></img>
        <p>
          {'请扫描二维码登陆'}
        </p>
      </div>
    )
  }
}

class WXAvatar extends Component {

  render() {
    const { avatar = 'data:img/jpg;base64' } = this.props
    return (
      <div>
        <img src={avatar} style={{ maxWidth: 200 }} alt='Avatar'></img>
        <p>
          {'请在手机上确认以登陆'}
        </p>
      </div>
    )
  }
}

class WXProfile extends Component {

  render() {
    const { token } = this.props
    return (
      <div>
        <p>
          {JSON.stringify(token)}
        </p>
      </div>
    )
  }
}
