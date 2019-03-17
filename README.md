# Linchatrj

这个项目是对ReacJS学习的技能的一个回顾，至于为什么要用微信网页版的协议，原因有至少两个，一是微信网页版竟然歧视我的Ubuntu系统，在我要登陆网页版微信的时候，其前端JS逻辑代码会自动调用到微信登出接口，令Linux用户不能使用微信网页版；二是微信网页版的协议解析在很多人的帖子中都有研究，并且我尝试了一下接口发现都可以通过自己构造请求正确响应。虽然大多数帖子是互相抄袭，好歹还是有真正做研究的人，下面列出两个我的主要参考的帖子：

[https://www.cnblogs.com/flashsun/p/8493306.html](https://www.cnblogs.com/flashsun/p/8493306.html)
这篇比较旧，胜在对一些特殊意义的参数有解析，对我帮助不少。

[https://www.jianshu.com/p/43f54e4b3dc1](https://www.jianshu.com/p/43f54e4b3dc1)
这篇比较新，不过好像漏了一些接口没有介绍。

虽然微信网页版发展了这么多年，但是其协议还是没有轻易改动，所以下面借用大神的图
```
       +--------------+     +---------------+   +---------------+
       |              |     |               |   |               |
       |   Get UUID   |     |  Get Contact  |   | Status Notify |
       |              |     |               |   |               |
       +-------+------+     +-------^-------+   +-------^-------+
               |                    |                   |
               |                    +-------+  +--------+
               |                            |  |
       +-------v------+               +-----+--+------+      +--------------+
       |              |               |               |      |              |
       |  Get QRCode  |               |  Weixin Init  +------>  Sync Check  <----+
       |              |               |               |      |              |    |
       +-------+------+               +-------^-------+      +-------+------+    |
               |                              |                      |           |
               |                              |                      +-----------+
               |                              |                      |
       +-------v------+               +-------+--------+     +-------v-------+
       |              | Confirm Login |                |     |               |
+------>    Login     +---------------> New Login Page |     |  Weixin Sync  |
|      |              |               |                |     |               |
|      +------+-------+               +----------------+     +---------------+
|             |
|QRCode Scaned|
+-------------+
```

可以看到主要流程就是：

-->先请求二维码-->然后轮询等待用户扫描二维码和确认登陆-->登陆成功后init-->请求联系人列表（这里我没做）-->打开消息通知-->轮询检查消息-->如果收到新消息则自己处理一下（显示信息、更新联系人在列表中的位置等等）

我的应用的技术栈是，前端用ReactJS，后端用EggJS（在另一个项目中），因为前端是不能跨域访问微信网页版API的，所以配合后端访问微信网页版的API，后端还可以更改请求头里面的各个参数，例如User-Agent、Cookie、Accept等等。

分析微信网页版API的方式，我是在别的非Linux机器上用Chrome浏览器开调试（Preserve Log），登陆，然后右键保存har文件，之后可以用har文件分析工具重现，不过这文件容易泄漏秘密信息，要小心使用。

这里面需要注意的是有些地方：
1. 请求里面的User-Agent改个好看点的，我怀疑微信网页版前端就是靠这个判断我是Linux系统的
2. webwxinit必须添加Cookie，而且要注意这个API的URL是带参数的（就是有点像GET的方式将参数拼接到URL中，但事实上需要POST发送）
3. webwxstatusnotify也要添加Cookie
4. webwxgeticon获取各个头像的时候也很坑，不但需要Cookie，也需要Accept，也要注意别在User-Agent中暴露自己是Linux系统的，否则就怎么都不能得到头像信息，获取得到的头像数据其实是JS中的Buffer类型数组，幸好JS能够直接用toString('base64')的方式直接获得url
5. synccheck和webwxsync这两个接口就是同步消息的关键了，注意webwxsync之后需要更新syncCheckKey和syncKey，并在下一次检查消息同步时使用

消息同步过来之后想怎么显示都可以了，发送消息的没有精力去做了，况且只是调用一下接口，没有特别需要注意的地方。

最后附一张运行起来之后的截图

![截图](https://github.com/runninggoat/linchatrj/tree/master/readmeimg/screenshot.png)

==========

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.<br>
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.<br>
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br>
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (Webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: https://facebook.github.io/create-react-app/docs/code-splitting

### Analyzing the Bundle Size

This section has moved here: https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size

### Making a Progressive Web App

This section has moved here: https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app

### Advanced Configuration

This section has moved here: https://facebook.github.io/create-react-app/docs/advanced-configuration

### Deployment

This section has moved here: https://facebook.github.io/create-react-app/docs/deployment

### `npm run build` fails to minify

This section has moved here: https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify
