import React, { Component } from 'react';
import { Row, Col, Icon } from 'antd';
import COLORS from './colors'

const domain = 'https://wx2.qq.com'

class WxWindow extends Component {

  render() {
    const { User, ContactList, MPSubscribeMsgList, SyncKey } = this.props
    return (
      <div>
        <Row style={{ height: 400 }}>
          <MenuBar User={User} />
          <WxSide User={User} ContactList={ContactList}></WxSide>
        </Row>
      </div>
    )
  }
}

export default WxWindow

class MenuBar extends Component {
  render() {
    const { User } = this.props
    // const iconUrl = `${domain}${User.HeadImgUrl}`
    const iconUrl = 'https://res.wx.qq.com/a/wx_fed/webwx/res/static/img/2KriyDK.png'
    return (
      <Col span={1} style={{ backgroundColor: '#2f2f2f', padding: 10, height: '100%' }}>
        <img src={iconUrl} alt='User icon' style={{ width: 35, height: 35, borderRadius: 4 }}/>
      </Col>
    )
  }
}

class WxSide extends Component {
  render() {
    const { User } = this.props
    return (
      <Col span={5} style={{ backgroundColor: '#3e3e3e', padding: 10, height: '100%' }}>
        <div>
          <Row style={{ backgroundColor: '#464646', borderRadius: 4, padding: 5 }}>
            <Col span={2}>
              <Icon type='search' style={{ color: '#5a5a5a', fontSize: 20, marginTop: 3 }}></Icon>
            </Col>
            <Col span={22}>
              <input placeholder='搜索联系人' style={{ backgroundColor: 'transparent', border: 'none', lineHeight: '25px' }}></input>
            </Col>
          </Row>
        </div>
        {/* <Row>
          <Col span={4}>
          </Col>
          <Col span={20}>
            <p style={{ fontSize: 24, textAlign: 'left' }}>
              {User['NickName']}
            </p>
          </Col>
        </Row> */}
      </Col>
    )
  }
}
