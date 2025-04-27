// WebSocket 连接引用
let ws: WebSocket | null = null;

// 创建文本框
function createTextbox(): HTMLInputElement {
  const textboxContainer = document.createElement("div");
  textboxContainer.style.position = "fixed";
  textboxContainer.style.bottom = "20px";
  textboxContainer.style.right = "20px";
  textboxContainer.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
  textboxContainer.style.padding = "10px";
  textboxContainer.style.borderRadius = "5px";
  textboxContainer.style.color = "white";
  textboxContainer.style.fontFamily = "Arial, sans-serif";

  const urlInput = document.createElement("input");
  urlInput.type = "text";
  urlInput.placeholder = "Enter WS URL";
  urlInput.style.padding = "5px";
  urlInput.style.fontSize = "14px";
  urlInput.style.width = "250px";
  urlInput.style.marginRight = "10px";
  urlInput.style.border = "1px solid #ccc";
  urlInput.style.borderRadius = "3px";

  textboxContainer.appendChild(urlInput);
  document.body.appendChild(textboxContainer);

  return urlInput;
}

// JSON 验证函数
function isJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  }
  catch {
    return false;
  }
}

// WebSocket 连接管理
function connectWebSocket(url: string | URL): void {
  // 清理旧连接
  if (ws) {
    ws.close();
    ws = null;
  }

  try {
    ws = new WebSocket(url);
  }
  catch (error) {
    console.error("Invalid WebSocket URL:", error);
    return;
  }

  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;

  // eslint-disable-next-line unused-imports/no-unused-vars
  const handleReconnect = () => {
    // eslint-disable-next-line ts/no-use-before-define
    if (reconnectAttempts < maxReconnectAttempts && urlInput.value.trim()) {
      reconnectAttempts++;
      console.log(`Reconnecting (attempt ${reconnectAttempts}/${maxReconnectAttempts})...`);
      // eslint-disable-next-line ts/no-use-before-define
      setTimeout(() => connectWebSocket(urlInput.value.trim()), 3000);
    }
  };

  ws.onopen = () => {
    reconnectAttempts = 0; // 重置重连计数器
    console.log("WebSocket connected");
    if (SugarCube?.State?.variables) {
      (SugarCube.State.variables as SugarCubeStoryVariables).ws_url = url.toString();
    }
  };

  ws.onmessage = (event: MessageEvent) => {
    try {
      const receivedData = event.data;
      const is_json = isJSON(receivedData);
      if (is_json) {
        console.debug(`ws请求数据:${JSON.stringify(receivedData)}`);
      }
      else {
        console.debug(`ws请求返回非JSON数据:${receivedData}`);
      }

      if (receivedData === "get") {
        const data = SugarCube?.State?.variables;
        ws?.send(JSON.stringify(data));
      }
      else if (is_json) {
        const parsedData = JSON.parse(receivedData);
        if (parsedData.variables) {
          (SugarCube.State.variables as any) = parsedData.variables;
        }
      }
    }
    catch (e) {
      console.error("Message handling error:", e);
    }
  };

  ws.onerror = (error: Event) => {
    console.error("WebSocket error:", error);
  };

  ws.onclose = (event: CloseEvent) => {
    console.log(`WebSocket disconnected (code: ${event.code}, reason: ${event.reason})`);
  };
}

// 初始化逻辑
function initializeWebSocket(): void {
  setTimeout(() => {
    const storedUrl = (SugarCube?.State?.variables as SugarCubeStoryVariables)?.ws_url;
    if (storedUrl) {
      // eslint-disable-next-line ts/no-use-before-define
      urlInput.value = storedUrl;
      connectWebSocket(storedUrl);
    }
  }, 10000);
}

// 创建输入框并设置监听
const urlInput = createTextbox();
urlInput.addEventListener("input", () => {
  const newUrl = urlInput.value.trim();
  if (newUrl) {
    connectWebSocket(newUrl);
  }
  else if (ws) {
    ws.close();
  }
});

// 启动初始化
initializeWebSocket();
