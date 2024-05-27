# Build your own React 中文版

本repo是翻译英文版：https://pomb.us/build-your-own-react/

创建自己版本的react会分解成下面几个步骤：

- 第一步：createElement函数
- 第二步：render函数
- 第三步：并发(concurrent)模式
- 第四步：Fibers
- 第五步：render和commit阶段
- 第六步：Reconciliation
- 第七步：函数组件
- 第八步：hooks

# 第0步：回顾

先回顾下基础的概念，如果你已经知道React，JSX和DOM是如何工作的，可以跳过这步。

```javascript
const element = <h1 title="foo">Hello</h1>
const container = document.getElementById("root")
ReactDOM.render(element, container)
```

我们就用这三行代码来回顾。第一个定义了一个react元素，第二行从DOM中获取了一个节点，最后一行在container中渲染了react元素。现在就让我们用普通的js语法来逐步替换react语法。

第一行是用JSX定义的，从JSX转换到JS通常可以用一些类似Babel的编译工具。转换的过程很简单：调用createElement替换标签里的内容，并且传递tag名、props和children作为参数。

React.createElement从参数中创建一个对象，除了一些验证，这就是它做的所有事。所以，我们可以用输出结果来替代这个函数的调用。

```javascript
// const element = <h1 title="foo">Hello</h1> 替换为
const element = {
  type: "h1",
  props: {
    title: "foo",
    children: "Hello",
  },
}
```

这个element有两个属性，type和props，实际上有更多，但我们现在只关注这两个。type的类型是string，它表示我们要创建的DOM节点的类型，也就是你传递给document.createElement的tagName。props也是一个对象，它有JSX属性中所有的键值对，它还有一个特殊的属性：children。在这个例子中，children是一个string，但通常chilren是一个带着更多element的数组，这也是为什么elements可以组成树。

我们还需要替换ReactDOM.render。首先用element.type创建节点，然后将props传递给节点，这个例子里只有title。然后再为children创建节点，本例中只有文本，所以创建一个text节点。最后把text节点和h1都加到html里。

```javascript
// 下面替代 ReactDOM.render(element, container);
const node = document.creatElement(element.type);
node['title'] = node.props.title;

const text = document.createTextNode('');
text['nodeValue'] = element.props.children;

node.appendChild(text);
container.appendChild(node);
```

现在我们没有用React实现了之前那三行React代码。

# 第一步：createElement函数

让我们从一个新的app开始

```javascript
const element = (
  <div id="foo">
    <a>bar</a>
    <b />
  </div>
);
const container = document.getElementById("root");
ReactDOM.render(element, container);
```

正如之前步骤里说的，元素是一个带有type和props的对象，而createElement唯一要做的就是创建出这个对象。

```javascript
const element = React.createElement(
   "div",
   {id: "foo"},
    React.createElement("a", null, "bar"),
    React.createElement("b")
)
```

我们对props使用展开符，对children用剩余参数语法，这样的话，参数children永远是一个数组。

```javascript
function createElement(type, props, ...children) {
    return {
        type,
        props: {
            ...props,
            children
        },
    };
}
```

例如，`createElement("div")` 返回

```javascript
{
  "type": "div",
  "props": { "children": [] }
}
```

`createElement("div", null, a)` 返回:

```javascript
{
  "type": "div",
  "props": { "children": [a] }
}
```

`createElement("div", null, a, b)` 返回:

```javascript
{
  "type": "div",
  "props": { "children": [a, b] }
}
```

但是有一点还没考虑到，children也可能包含像string，number这些类型的原始数值。所以可以为它们创建一个特殊类型：TEXT_ELEMENT。

```javascript
function createElement(type, props, ...children) {
    return {
        type,
        props: {
            ...props,
            children: children.map(child => 
            	typeof child === 'object'
                ? child
                : createTextElement(child)
            ),
        },
    };
}
function createTextElement(text) {
    return {
        type: 'TEXT_ELEMENT',
        props: {
            nodeValue: text,
            children: [],
        }
    }
}
```

当没有children时，React不会像我们一样包裹原始值或者创建一个空数组。但我们这样做可以简化代码，并且我们更倾向于简洁的代码而不是高性能代码。

为了替换React，我们给自己的库命名为Didact，那么之前的代码就会被替换为

```javascript
const element = Didact.createElement(
   "div",
   {id: "foo"},
    Didact.createElement("a", null, "bar"),
    Didact.createElement("b")
)
```

但如何告诉babel用Didact的createElement而不是React的呢？

可以添加下面的注释，当babel转译时，将会用我们的createElement。

```javascript
/** @jsx Didact.createElement */
const element = (
  <div id="foo">
    <a>bar</a>
    <b />
  </div>
);
```



# 第二步：render函数

接下来，我们要写一个自己版本的ReactDOM.render函数。

目前，我们只关心往DOM里添加内容，待会儿再处理更新和删除。首先用元素的type创建DOM节点，然后把新节点添加到container中。

```javascript
export function render(element, container) {
  const dom = document.createElement(element.type);
  container.appendChild(dom);
}
```

接着递归地为每一个child做同样的操作

```javascript
export function render(element, container) {
  const dom = document.createElement(element, type);
  element.props.children.forEact(child => render(child, dom));
  container.appendChild(dom);
}
```

还需要额外处理文本节点，如果类型是TEXT_ELEMENT，那么就创建文本节点

```javascript
export function render(element, container) {
  const dom = element.type === 'TEXT_ELEMENT'
    ? document.createTextNode('')
    : document.createElement(element.type);
  element.props.children.forEach(child => render(child, dom));
  container.appendChild(dom);
}
```

最后，把props传递给节点

```javascript
export function render(element, container) {
  const dom = element.type === 'TEXT_ELEMENT'
    ? document.createTextNode('')
    : document.createElement(element.type);
    
  const isProperty = key => key !== 'children';
  Object.keys(element.props)
    .filter(isProperty)
    .forEach(name => {
      dom[name] = element.props[name]
    });
    
  element.props.children.forEact(child => render(child, dom));
  container.appendChild(dom);
}
```

好啦，我们现在可以把JSX渲染到DOM上了，git clone git@github.com:KimKeepLearning/build-own-react.git，切到jsx2dom分支，安装依赖，然后npm start可以看到效果











































