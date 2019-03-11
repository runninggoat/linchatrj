import React, { Component } from 'react';
import { Row, Col } from 'antd';
import COLORS from './colors'

class WxWindow extends Component {

  render() {
    const { User, ContactList, MPSubscribeMsgList, SyncKey } = this.props
    return (
      <div>
        <Row>
          <WxSide User={User} ContactList={ContactList}></WxSide>
        </Row>
      </div>
    )
  }
}

export default WxWindow

class WxSide extends Component {
  render() {
    const { User } = this.props
    return (
      <Col span={6}>
        <p>
          {User['NickName']}
        </p>
      </Col>
    )
  }
}
