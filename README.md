
# 使用说明


## `重要提示`

该项目使用 Cocos Creator 版本为 v1.10.3.

v1.10 的穿透遮罩点击与 v2.x 版本的穿透遮罩点击不一致, 所以在 v1.10 种增加了下方代码, 达到与 v2.x 同步一致.

如果是 v2.x 版本, 则需要手动删除下方代码:

```ts
// [v1.10] mask重写
/** 非常重要！！！！！！ v1.10的遮罩无法点击穿透, 修改后, 就能够点击穿透了 */
let mask_inverted = false;
const mask_hitTest = cc.Mask.prototype["_hitTest"];
cc.Mask.prototype["_hitTest"] = function () {
    if (mask_inverted) {
        return !mask_hitTest.apply(this, arguments);
    } else {
        return mask_hitTest.apply(this, arguments);
    }
}
```

<br>



## 建议

> 建议查看 [GuideParse.ts](./assets/Script/guide/entrance/GuideParse.ts) 内所有的 `type` 和 `enum`， 便于理解引导内容格式

<br>




## 实现逻辑

 主要分为 `数据解析` + `入口` + `步骤`, 其中一个入口包含多个步骤, 即一个引导由多个操作步骤组成.

- 数据来源: 基于 Excel 表格配置. 会解析为 `所属单引导的所有步骤 ⊆ 单引导` , 其中引导包含入口条件, 步骤相互独立且拥有对应的操作、UI显示数据.

- 入口：触发场景、触发次数上限、依赖触发项.
    - 需要改写引导的[触发入口](./assets/Script/guide/entrance/GuideParse.ts)内的 `getCanRunGuide` 函数, 自行过滤对应场景的引导, `如果有跨场景连续运行的多个引导, 建议参考着重写 !`

    - tips: 依赖触发项, 一般会有 B 引导基于 A 引导完成后才能运行, 所以在获取可运行引导时, 会过滤掉`所依赖引导未完成`的引导.


- 步骤：查找对应内容, 操作对应内容, 和过程中的 UI 显示.

    - 查找对应内容: 主要是查找节点, 查找分为以下几种 - 1绝对路径查找, 2回调函数查找, 3事件监听返回的节点, 4跳过查找. 
        - 对应表格的 seek_node_type、seek_node_param 字段

    - 操作对应内容: 主要是玩家在该步骤中的操作反馈, 操作的结束方式分为以下几种 - 1点击节点结束, 2事件监听, 3点击任意处,mask需要为全屏透明遮罩!

        - 对应表格的 step_finish_type、step_finish_param 字段

    - UI内容: 目前有手指头、遮罩、提示框, 后续有需求可以自行新增

        - 手指头: 目前只有显示和隐藏两种, 后续会继续迭代

            - 对应表格字段 hand_tips_type

        - 提示框: 文本内容和文本内容位置组成

            - 对应表格字段 tips_text_content、tips_text_position

        - 遮罩: 1全屏挖空遮罩, 2挖孔遮罩, 3透明挖空遮罩, 4透明全屏遮罩, 5透明全屏遮罩,无阻挡版,用于穿透点击事件 
        
            - 对应表格字段mask_type


<br>

<br>




## 如何上手

- 自行修改引导配置 excel 文件

    - [表格文件](./guide/guide.xlsx)  所在文件夹为项目`根目录/guide`

    - [excel 转 json 网址](https://www.bejson.com/json/col2json/)

- 转 json 后替换 [guide.json](./assets/resources/guide.json)

- 根据 excel 配置, 修改 [GuideConfig.ts](./assets/Script/guide/config/GuideConfig.ts) 引导路径对应的配置

- 根据 excel 配置, 修改所需 [GuideFunUtils.ts](./assets/Script/guide/config/GuideFunUtils.ts) 引导事件函数的配置
    
    - 注意: 如果是事件监听, 需要在对应游戏功能发送事件

- 修改 [GuideParse.ts](./assets/Script/guide/entrance/GuideParse.ts) 内的引导触发入口函数 `runGuide();`

- 如果有自己新增的表格字段, 应该在 [GuideParse.ts](./assets/Script/guide/entrance/GuideParse.ts) 脚本内修改引导数据解析, 并且在 [GuideNormalStep.ts](./assets/Script/guide/step/GuideNormalStep.ts) 修改对应的文件


<br>

<br>




## 浏览器测试

手动开启引导 GuideParse.testtest(GuideKey)




<br>

## 版本迭代计划

- 强引导、弱引导

- 引导步骤跳过

- 引导打断跳过

- 引导步骤出现错误, 无法正常运行, 跳过

- 遮罩边缘光晕

- 不规则遮罩

- 多种手指动画

- 群按钮点击 - 可以用事件实现
