import React, { Component } from 'react';
import { Row, Col, Icon, List, Avatar } from 'antd';
import COLORS from './colors'

const { Item } = List
const { Meta } = Item

const domain = 'https://wx2.qq.com'
const windowHeight = 400

class WxWindow extends Component {

  state = {
    ready: false,
    syncing: false,
    loopId: 0,
    seq: 0,
    avatar: '',
    csrfToken: '',
    cookies: '',
    token: {},
    user: {},
    contactList: [],
    subscribeMsgList: [],
    syncKey: [],
    syncCheckKey: [],
    friends: {},
  }

  componentWillUnmount() {
    const { loopId } = this.state
    if (loopId) clearInterval(loopId)
  }

  componentWillReceiveProps(nextProps) {
    const { token, csrfToken, cookies, contactList, user, subscribeMsgList, syncKey, seq } = nextProps
    if (Object.keys(user).length < 1 || contactList.length < 1 || subscribeMsgList.length < 1 || syncKey.length < 1) return
    const friends = {}
    contactList.forEach(v => {
      friends[v.UserName] = { avatar: '', nickName: v.NickName, msgs: [] }
    })
    this.setState({ token, csrfToken, cookies, contactList, user, subscribeMsgList, syncKey, syncCheckKey: syncKey, friends, ready: true, seq }, () => {
      this._getAvatar()
      contactList.forEach(v => {
        this._getOtherIcon(v.HeadImgUrl, v.UserName)
      })
      const loopId = setInterval(() => {
        console.log('send sync check...')
        this._syncCheck()
      }, 1000)
      this.setState({ loopId })
    })
  }

  _getAvatar = async () => {
    const { user, avatar, cookies, csrfToken } = this.state
    const { HeadImgUrl } = user
    if (!HeadImgUrl || avatar) return
    const url = '/wxgeticon/'
    const params = { path: HeadImgUrl, cookies, accept: 'image/webp,image/apng,image/*,*/*;q=0.8' }
    // console.log('get icon', user, csrfToken, params)
    fetch(url, {
      body: JSON.stringify(params), // must match 'Content-Type' header
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': csrfToken,
      },
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
    }).then(response => {
      response.text().then(resp => {
        const respJSON = JSON.parse(resp)
        const avatar = respJSON.icon
        this.setState({ avatar })
      })
    })
  }

  _getOtherIcon = async (imageUrl, userName) => {
    const { friends, cookies, csrfToken } = this.state
    if (!imageUrl || friends[userName].avatar) return
    const url = '/wxgeticon/'
    const params = { path: imageUrl, cookies, accept: 'image/webp,image/apng,image/*,*/*;q=0.8' }
    // console.log('get icon', user, csrfToken, params)
    fetch(url, {
      body: JSON.stringify(params), // must match 'Content-Type' header
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': csrfToken,
      },
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
    }).then(response => {
      response.text().then(resp => {
        const respJSON = JSON.parse(resp)
        const { friends: curF } = this.state
        curF[userName].avatar = respJSON.icon
        this.setState({ friends: curF })
      })
    })
  }

  _syncCheck = async () => {
    const { ready, syncing, token, syncCheckKey, csrfToken, cookies, seq } = this.state
    this.setState({ seq: seq + 1 })
    if (!ready || syncing) return
    this.setState({ syncing: true })
    const url = '/synccheck/'
    let synckey = ''
    syncCheckKey.List.forEach(v => {
      synckey = synckey + `${v.Key}_${v.Val}|`
    })
    synckey = synckey.substring(0, synckey.length - 1)
    const params = {
      skey: token.skey,
      sid: token.wxsid,
      uin: token.wxuin,
      deviceId: token.deviceId,
      synckey,
      cookies,
      seq: seq + 1,
    }
    // console.log('get icon', user, csrfToken, params)
    fetch(url, {
      body: JSON.stringify(params), // must match 'Content-Type' header
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': csrfToken,
      },
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
    }).then(response => {
      response.text().then(resp => {
        // console.log(resp)
        const respJSON = JSON.parse(resp)
        console.log('_syncCheck', respJSON.msg)
        const selector = this._extractSelector(respJSON.msg)
        console.log('_syncCheck selector', selector)
        this.setState({ syncing: false })
        if (selector === 2) {
          this._syncMsg()
        }
      })
    })
  }

  _extractSelector = text => {
    const s = text.indexOf('selector')
    const i = text.indexOf('"', s)
    const j = text.indexOf('"', i + 1)
    return parseInt(text.substring(i + 1, j))
  }

  _syncMsg = () => {
    const { ready, token, syncKey, csrfToken, cookies } = this.state
    if (!ready) return
    const url = '/wxsyncmsg/'
    const params = {
      skey: token.skey,
      sid: token.wxsid,
      uin: token.wxuin,
      deviceId: token.deviceId,
      synckey: syncKey,
      cookies,
      passTicket: token.passTicket,
    }
    fetch(url, {
      body: JSON.stringify(params), // must match 'Content-Type' header
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': csrfToken,
      },
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
    }).then(response => {
      response.text().then(resp => {
        // console.log(resp)
        const respJSON = JSON.parse(resp)
        console.log('_syncMsg', respJSON)
        this.setState({ syncCheckKey: respJSON.data.SyncCheckKey, syncKey: respJSON.data.SyncKey })
      })
    })
  }

  render() {
    const { avatar, user, contactList, friends } = this.state
    return (
      <div>
        <Row style={{ height: windowHeight }}>
          <MenuBar avatar={avatar} />
          <WxSide contactList={contactList} friends={friends}></WxSide>
        </Row>
      </div>
    )
  }
}

export default WxWindow

class MenuBar extends Component {
  render() {
    const { avatar } = this.props
    let iconUrl = avatar
    if (!iconUrl) iconUrl = 'https://res.wx.qq.com/a/wx_fed/webwx/res/static/img/2KriyDK.png'
    return (
      <Col span={1} style={{ backgroundColor: '#2f2f2f', padding: 10, height: '100%' }}>
        <img src={iconUrl} alt='User icon' style={{ width: 35, height: 35, borderRadius: 4 }}/>
      </Col>
    )
  }
}

class WxSide extends Component {
  _renderItem = item => {
    let { avatar } = item
    if (!avatar) avatar = 'https://res.wx.qq.com/a/wx_fed/webwx/res/static/img/2KriyDK.png'
    return (
      <Item>
        <Meta
          avatar={<img src={avatar} alt='Contact icon' style={{ width: 35, height: 35, borderRadius: 6 }}/>}
          title={<div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: COLORS.white, textAlign: 'left' }} dangerouslySetInnerHTML={{ __html: item.nickName }}></div>}
          description=""
          onClick={() => console.log(item)}
        />
      </Item>
    )
  }

  render() {
    const { friends, contactList } = this.props
    const data = []
    contactList.forEach(v => {
      data.push(friends[v.UserName])
    })
    return (
      <Col span={5} style={{ backgroundColor: '#3e3e3e', padding: 10, height: '100%' }}>
        <Row style={{ backgroundColor: '#464646', borderRadius: 4, padding: 5 }}>
          <Col span={2}>
            <Icon type='search' style={{ color: '#5a5a5a', fontSize: 20, marginTop: 3 }}></Icon>
          </Col>
          <Col span={22}>
            <input placeholder='搜索联系人' style={{ backgroundColor: 'transparent', border: 'none', lineHeight: '25px' }}></input>
          </Col>
        </Row>
        <Row>
          <Col span={24} style={{ overflowY: 'scroll', overflowX: 'hidden', height: windowHeight - 50 }}>
            <List
              itemLayout="horizontal"
              dataSource={data}
              renderItem={this._renderItem}
            />
          </Col>
        </Row>
      </Col>
    )
  }
}
