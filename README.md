## Nicomment

Nicomment是一个用于下载N站弹幕的工具，使用Electron + MaterialUI + TypeScript开发。由于[NicomentXenoglossia](http://xeno.grrr.jp)的作者已不再维护，故开发此程序。

下载弹幕后，将以xml格式与(与NicomentXenoglossia再构成处理后的文件格式相同)保存在指定的位置。之后可以通过[danmaku2ass](https://github.com/m13253/danmaku2ass)等工具转换为ass字幕文件或在支持n站弹幕格式的播放器中使用。

## 使用前须知

* 请确保所在的网络环境可以正常访问n站，观看官方Channel动画。如果使用科学上网，请确保真正的“全局代理”，而不是只有浏览器走代理。如无法观看Channel动画，则代表科学上网并非日本原生IP。
* 在该软件中登录后有时会导致网页端登录状态下线，短时间内频繁登录有可能导致帐号被锁，需要在网页端按照指引通过重置密码来解锁。**不排除对帐号有其他未知影响。**
* 本软件不会收集任何包括帐号密码在内的隐私数据。

## TODO

* 历史弹幕下载
* 弹幕文件预处理(实际上就是NicomentXenoglossia的再构成)
* 集成弹幕文件转ass字幕文件的功能
* 视频下载

