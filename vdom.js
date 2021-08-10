/**
 *  javascript
 * @Author: zcw
 * @Date: 2021-06-09
 * @Desc: 创建vNode对象
 */

/**
 * 构建一个虚拟dom对象
 * @param {*} tag 元素的标签
 * @param {*} data  元素的属性数据，例如attr，class等
 * @param {*} children 子元素
 */
export const h = (tag, data = {}, children) => {
  let text = "";
  let el; // 真实dom元素
  let key; // 指向元素的唯一key值，用来做diff算法
  if (typeof children === "string" || typeof children === "number") {
    // 子元素是文本节点
    text = children;
    children = undefined;
  } else if (!Array.isArray(children)) {
    // 子元素要有的话必须是一个数组
    children = undefined;
  }
  if (data && data.key) {
    key = data.key;
  }
  return {
    tag,
    data,
    children,
    text,
    key,
    el,
  };
};

/**
 * 创建一个虚拟元素节点
 * @param {*} vnode 虚拟元素节点
 */
const createEl = (vnode) => {
  let el = document.createElement(vnode.tag);
  vnode.el = el;
  // 遍历该节点，加入该节点存在子节点，递归创建
  if (vnode.children && vnode.children.length > 0) {
    vnode.children.forEach((element) => {
      el.appendChild(createEl(element));
    });
  }
  // 文本
  if (vnode.text) {
    el.appendChild(document.createTextNode(vnode.text));
  }
  return el;
};

/**
 * 判断两个节点是否为统一节点
 * @param {*} node1 节点1
 * @param {*} node2 节点2
 */
const isSameNode = (node1, node2) => {
  return node1.key === node2.key && node1.tag === node2.key;
};

/**
 * 判断一个节点列表里是否存在某节点，并返回其索引
 * @param {*} list 节点列表
 * @param {*} node 查找的节点
 */
const findSameNode = (list, node) => {
  return list.findIndex((item) => {
    return item && isSameNode(item, node);
  });
};

/**
 * diff算法
 * @param {*} el 真实元素
 * @param {*} oldChildren 旧的vnode节点
 * @param {*} newchildren 新的vnode节点
 */
const diff = (el, oldChildren, newchildren) => {

  // 四个指针
  let oldStartIndex = 0;
  let oldEndIndex = oldChildren.length-1;
  let newStartIndex =0;
  let newEndIndex = newchildren.length -1;
  // 初始化四个指针对应的节点
  let oldStartVNode = oldChildren[oldStartIndex];
  let oldEndVNode = oldChildren[oldEndIndex];
  let newStartVNode = newchildren[newStartIndex];
  let newEndVNode = newchildren[newEndIndex];
  while (oldStartIndex<=oldEndIndex && newStartIndex <=newEndIndex) {
    if (oldStartVNode === null) {
      oldStartVNode = oldChildren[++oldStartIdx];
    } else if(oldEndVNode === null) {
      oldStartVNode = oldChildren[--oldEndIndex];
    } else if (newStartVNode === null) {
      newStartVNode = newchildren[++newStartIndex];
    } else if (newEndVNode === null) {
      newEndVNode = newVNode[--newEndIndex];
    } else if (isSameNode(oldStartVNode, newStartVNode)) {  // 头头比较
      patchVnode(oldStartVNode, newStartVNode);
      // 更新指针
      oldStartVNode = oldChildren[++oldStartIndex];
      newStartVNode = newchildren[++newStartIndex];
    } else if (isSameNode(oldStartVNode, newEndVNode)) { // 头尾比较
      patchVnode(oldStartVNode, newEndVNode);
      // 需要将oldVNode 节点移到最后，与新节点的顺序一致
      el.insertBefore(oldStartVNode.el, oldEndVNode.el.nextSibling);
      // 更新指针
      oldStartVNode = oldChildren[++oldStartIndex];
      newEndVNode = newchildren[--newEndIndex];
    } else if (isSameNode(oldEndVNode, newStartVNode)) { // 尾头比较
      patchVnode(oldEndVNode, newStartVNode);
      // 将oldEndVnode 节点移到oldStartvnode前；
      el.insertBefore(oldEndVNode.el, oldStartVNode.el);
      // 更新指针
      oldEndVNode = oldChildren[--oldEndIndex];
      newStartVNode = newchildren[++newStartIndex];
    } else if (isSameNode(oldEndVNode, newEndVNode)) { // 尾尾比较
      patchVnode(oldEndVNode, newEndVNode);
      // 更新指针
      oldEndVNode = oldChildren[--oldEndIndex];
      newEndVNode = newchildren[--newEndIndex];
    } else {
      // 最后看下旧的子节点群中是否有新节点群的第一个，只找下第一个
      let findIndex = findSameNode(oldChildren, newStartVNode);
      // 说明newStartVNode在旧列表里不存在，那么就是一个新的节点，需要创建
      if (findIndex === -1) {
        el.insertBefore(createEl(newStartVNode), oldStartVNode.el)
      } else { // 在旧列表里存在，那么就进行patch，移动指针
        let oldVNode = oldChildren[findIndex];
        patchVnode(oldVNode, newStartVNode);
        // 且要移动该节点到旧列表的第一位, 并把旧列表的当前位置节点置为null
        el.insertBefore(oldVNode, oldStartVNode.el);
        oldChildren[findIndex] = null;
      }
      newStartVNode = newchildren[++newStartIndex];
    }
  }
  // 循环结束了，还得判断，旧列表里是否还存在新列表里没有的节点，有就删除
  if (oldStartIndex <= oldEndIndex) {
    for (var i = oldStartIndex; i<=oldEndIndex; i++) {
      removeEvent(oldChildren[i]);
      oldChildren[i] && el.removeChild(oldChildren[i].el)
    }
  } else if(newStartIndext <=newEndIndexd) {
    // 在新列表当前的end指针按顺序一个个插入
    let before = newchildren[newEndIndex+1] ? newchildren[newEndIndex+1].el : null;
    for (let i = newStartIndex; i <=newEndIndex; i++) {
      el.insertBefore(createEl(newchildren[i]), before);
    }
  }

};

/**
 * 更新dom类名
 * @param {*} el 真实元素
 * @param {*} newVNode 新节点
 */
const updateClass = (el, newVNode) => {
  el.className = "";
  if (newVNode.data && newVNode.data.class) {
    let className = "";
    Object.keys(newVNode.data.class).forEach((val) => {
      if (newVNode.data.class[val]) {
        className += val + " ";
      }
    });
    el.className = className;
  }
};

/**
 * 更新dom的style样式
 * @param {*} el
 * @param {*} oldVNode
 * @param {*} newVNode
 */
const updateStyle = (el, oldVNode, newVNode) => {
  let oldStyle = (oldVNode && oldVNode.data.style) || {};
  let newStyle = newVNode.data.style || {};
  // 移除旧节点中新节点不存在的样式
  Object.keys(oldStyle).forEach((key) => {
    if (newStyle[key] === undefined || newStyle[key] === "") {
      el.style[key] = "";
    }
  });
  // 添加旧节点不存在的新样式
  Object.keys(newStyle).forEach((key) => {
    if (oldStyle[key] !== newStyle[key]) {
      el.style[key] = newStyle[key];
    }
  });
};

/**
 * 更新属性
 * @param {*} el 真实元素
 * @param {*} oldVNode 旧的虚拟节点
 * @param {*} newVNode 新的虚拟节点
 */
const updateAttr = (el, oldVNode, newVNode) => {
  let oldAttr = oldVNode && oldVNode.data.attr ? oldVNode.data.attr : {};
  let newAttr = newVNode.data.attr || {};
  // 移除旧节点中不存在新节点中的属性
  Object.keys(oldAttr).forEach((key) => {
    if (newAttr[key] === undefined || newAttr[key] === "") {
      el.removeAttribute(key);
    }
  });
  // 添加旧节点不存在的新属性
  Object.keys(newAttr).forEach((key) => {
    if (oldAttr[key] !== newAttr[key]) {
      el.setAttribute(key, newAttr[key]);
    }
  });
};


/**
 * 更新绑定事件
 * @param {*} el 真实元素
 * @param {*} oldVNode 旧的虚拟dom
 * @param {*} newVNode  新的虚拟dom
 */
const updateEvent = (el, oldVNode, newVNode) => {
  let oldEvent = oldVNode && oldVNode.data.event ? oldVNode.data.event : {};
  let newEvent = newVNode.data.event || {};

  Object.keys(oldEvent).forEach((e) => {
    if (newEvent[e] === undefined || newEvent[e] === "") {
      el.removeEventListener(e, oldEvent[e]);
    }
  });
  Object.keys(newEvent).forEach((e) => {
    if (oldEvent[e] !== newEvent[e]) {
      el.addEventListener(e, newEvent[e]);
    }
  });
};

/**
 * 移除旧节点的事件监听
 * @param {*} oldVNode
 */
const removeEvent = (oldVNode) => {
  if (oldVNode && oldVNode.data && oldVNode.data.event) {
    Object.keys(oldVNode.data.event).forEach((e) => {
      oldVNode.el.removeEventListener(e, oldVNode.data.event[e]);
    });
  }
};

/**
 * 比较新旧VNode的具体实现，找到差异来更新实际的dom
 * @param {*} oldVNode 旧的VNode
 * @param {*} newVNode 新的VNode
 */
const patchVnode = (oldVNode, newVNode) => {
  if (oldVNode === newVNode) {
    return;
  }
  if (oldVNode.tag === newVNode.tag) {
    // 新旧节点的元素类型相同，为了节省性能，肯定是复用旧元素的
    let el = (newVNode.el = oldVNode.el);
    // 看是否需要更新class、style、attr属性、以及绑定的事件
    updateClass(el, newVNode);
    updateStyle(el, oldVNode, newVNode);
    updateAttr(el, oldVNode, newVNode);
    updateEvent(el, oldVNode, newVNode);
    if (newVNode.text) {
      // 新节点是文本节点
      // 那么就移除旧节点的所有子节点
      oldVNode.children &&
        oldVNode.children.forEach((item) => {
          // 移除节点，需要解绑绑定事件，不然可能会造成内存泄露
          removeEvent(item);
          el.removeChild(item.el);
        });
      // 旧节点也是文本节点的话，比较其文本内容
      if (oldVNode.text !== newVNode.text) {
        el.textContent = newVNode.text;
      }
    } else {
      // 新旧节点都存在子节点的话，就进行diff计算其差别
      if (newVNode.children && oldVNode.children) {
        diff(el, oldVNode.children, newVNode.children);
      } else if (oldVNode.children) {
        // 新节点没有子节点，那么移除旧节点的所有子节点
        oldVNode.children.forEach((item) => {
          removeEvent(item);
          el.removeChild(item.el);
        });
      } else if (newVNode.children) {
        // 新节点存在子节点，但是旧节点不存在，那么创建
        if (oldVNode.text) {
          // 旧节点存在文本节点的话，也要移除
          el.textContent = "";
        }
        newVNode.children.forEach((item) => {
          // 将新节点变成vnode结构进行创建
          el.appendChild(createEl(item));
        });
      } else if (oldVNode.text) {
        // 新节点啥都没有，但旧节点有文本节点
        el.textContent = "";
      }
    }
  } else {
    // 新旧节点属于不同的类型，那么就要用newVNode来替换旧的VNode
    let newEl = createEl(newVNode);
    // 更新对应属性及移除旧节点绑定事件
    updateClass(newEl, newVNode);
    updateStyle(newEl, null, newVNode);
    updateAttr(newEl, null, newVNode);
    removeEvent(oldVNode);
    updateEvent(newEl, null, newVNode);
    let parent = oldVNode.el.parentNode;
    parent.insertBefore(newEl, oldVNode.el);
    parent.removeChild(oldVNode.el);
  }
};

/**
 * 主入口文件，比较新旧VNode,
 * @param {*} oldVNode 可能是DOM元素或者是VNode
 * @param {*} newVNode 新的VNode
 */
export const patch = (oldVNode, newVNode) => {
  // 如果是dom元素，转换为Vdom格式的vnode
  if (!oldVNode.tag) {
    let el = oldVNode;
    el.innerHTML = "";
    oldVNode = h(oldVNode.tagName.toLowerCase());
    oldVNode.el = el;
  }
  patchVnode(oldVNode, newVNode);
  return newVNode;
};
