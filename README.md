# ElementUi Table 组件性能改造
> 分析问题引用自有道云笔记：[基于Vue的ElementUI的表格控件的性能改进的尝试](https://note.youdao.com/share/?id=3196f65b21037d48e3037b93fd9b3102&type=note#/)

## 提出问题
在使用 ElementUi Table 组件的时候，测试中数据量达到100行40列的时候，点击全选卡顿。  

## 分析问题 
如下图，基于 ElementUI 的 Table 控件的表格，数据40列500行，点击勾选按钮，有很明显的延迟  
![](//git.michaelxu.cn/classroom/questions/elementui-table-optimize/raw/develop/assets/images/InterfaceScreenshot.jpg)

* 在 chrome 的开发者工具 Performance 面板里，录下操作  
![](//git.michaelxu.cn/classroom/questions/elementui-table-optimize/raw/develop/assets/images/2.png)  
从点击到完成勾选耗时2.3秒，从时间轴上看最主要的有两块，js执行（黄色的部分）时长800毫秒，界面重绘（紫色和绿色部分）1100毫秒，要优化要从这两部分入手；

* 如图，执行时间最长的，与 vuejs 无关的方法是 ElementUI 11323 行的 render 方法  
![](//git.michaelxu.cn/classroom/questions/elementui-table-optimize/raw/develop/assets/images/3.png)  
![](//git.michaelxu.cn/classroom/questions/elementui-table-optimize/raw/develop/assets/images/4.png)  
看来这是数据表格主体部分的 render 方法，根据对 vue.js 的了解，这个方法是由 vue 组件的模板转换过来的，它的调用是在模板中引用到的数据改动时由 vue 去调用更新 dom 的，并不是 ElementUI 组件主动调用的（[https://cn.vuejs.org/v2/api/#render](https://cn.vuejs.org/v2/api/#render)）。可能是表格的dom节点很多，就算是用的Virtual DOM，在diff时也要耗很长的时间。

* 表格内勾选状态改变了，有一个勾选的状态要反映在界面上，肯定伴随着某个数据值的改变，从而触发表格的 render 方法这是无法避免的。那么先把解决思路放两点:  
1.可能是由动画引起的多次重绘;  
2.表格和表格的数据尽量封装到一个组件里，数据的改变引起的render限制在这个组件内，而不去render整个应用。  

* 将多选框的 css 动画去掉  
![](//git.michaelxu.cn/classroom/questions/elementui-table-optimize/raw/develop/assets/images/5.png)    
再次录制操作  
![](//git.michaelxu.cn/classroom/questions/elementui-table-optimize/raw/develop/assets/images/6.png)  
从时间轴上看，原来有四个更新（紫色）四个重绘（绿色），总耗时约1000毫秒，现在只有两个更新（紫色）一个重绘（绿色），总耗时400多毫秒，耗时减少600毫秒，性能提升可以说比较明显  

* 既然 ElementUI 的 checkbox 勾选动画会导致重绘时间比较长，而且这个勾选框还要发起多个事件，让脚本运行时间变长，那么我们可以不用 ElementUI 提供的 checkbox ，使用原生的 checkbox 。
使用原生 checkbox 的代码在这几行：
    ```
    <el-table-column width="70" :render-header="renderCheckbox">
        <template slot-scope="scope">
            <input type="checkbox" v-model="scope.row.checked" />
        </template>
    </el-table-column>
    ```  
    运行后录制操作，性能有明显提升  
    ![](//git.michaelxu.cn/classroom/questions/elementui-table-optimize/raw/develop/assets/images/7.png)  
    脚本运行时间从800毫秒减低到500毫秒内，重绘时间200多毫秒，总时长到800多毫秒！比优化前耗时减少1500毫秒；  

* 既然勾选后，表格 render 不可避免，但可能 ElementUI 表格组件的 dom 结构比较复杂，进行 render 时要比较的数据比较多，在数据表格仅作展现时，是否可以使用原生表格来提升性能呢？于是将表格换成原生表格，用v-for循环输出表格数据，性能得到了一定的提升。  
![](//git.michaelxu.cn/classroom/questions/elementui-table-optimize/raw/develop/assets/images/8.png)    
跑js脚本这一部分的时间提升到300毫秒内，重绘时间也短到100毫秒内。比优化前耗时减少1800毫秒，至于其中的IDLE时间，可能是时间轴录制工具卡顿时导致的录制空白。  

    **总结：**  
    1.点击 ElementUI 表格中的 checkbox，后续的 js 逻辑耗时800毫秒，自己来管理 checkbox 点击后的事件，简化了js逻辑，可能使js部分耗时减少40%；  
    2.点击 ElementUI 表格中的 checkbox，动画导致的重绘耗时1000毫秒，使用原生的没有动画的 checkbox，可能使重绘部分性能提升耗时减少80%； 3.使用原生表格，让表格 render 时要比较的dom节点更少，可能使js部分耗时减少60%重绘部分耗时减少90%；  

    综上，优化后，总耗时减少 65%~80%（没有反复测试，可能存在误差）  

    总之，ElementUI 表格中多选框中的元素 spna.el-checkbox__inner 设置了动画，但没有设置为绝对定位，非常的影响性能。  
    ElementUI 表格中多选框点击后执行了“updateAllSelected”触发的页头重绘等耗时比较长，也影响性能。自己管理 ElementUI 表格的勾选功能是能减少耗时65%左右，使用原生表格对提升性能有限（多减少10%的耗时），考虑到功能的缺失建议在极度需要优化性能的情况下再用原生表格。  

## 解决方案
1. 更换原生成 checkbox 控件；
2. 接口返回数据放到状态（比如 vuex）或浏览器缓存里进行管理，防止内存过载；
3. 复杂的页面，分组件组建，互不污染和影响；
4. 40列数据节点太多，考虑先显示可视列数据，待拖到后面列再加载未显示列；
5. 接口对返回数据进行过滤，不要返回冗余或无用数据，而导致前台处理无用数据的开销。