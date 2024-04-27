const peer = new Peer("test", { host: "/", path: "peer" });
const cursor = document.getElementById("cursor");

let x = window.innerWidth / 2;
let y = window.innerHeight / 2;

const sensitivity = 1;

const sampleWindowSize = 10;
const samples = Array(sampleWindowSize).fill({ alpha: 0, beta: 0, gamma: 0 });

function getAverage() {
  // Calculate the weighted moving average of the last `sampleWindowSize` samples
  const totalWight = (sampleWindowSize * (sampleWindowSize + 1)) / 2;
  const average = samples.reduce(
    (acc, sample, i) => {
      acc.alpha += sample.alpha * (i + 1);
      acc.beta += sample.beta * (i + 1);
      acc.gamma += sample.gamma * (i + 1);
      return acc;
    },
    { alpha: 0, beta: 0, gamma: 0 }
  );
  return {
    alpha: average.alpha / totalWight,
    beta: average.beta / totalWight,
    gamma: average.gamma / totalWight,
  };
}

peer.on("open", (id) => {
  new QRCode(
    document.getElementById("qrcode"),
    `${window.location.origin}/send/${id}`
  );
  document.getElementById("peer").innerText = id;
});

peer.on("connection", (conn) => {
  console.log(`Remote peer ${conn.peer} connected`);

  cursor.style.visibility = "visible";

  conn.on("data", (data) => {
    if (data.alpha && data.beta && data.gamma) {
      samples.shift();
      samples.push(data);
    } else if (data === "d") {
      cursor.style.fill = "green";
    } else if (data === "u") {
      cursor.style.fill = "red";
      const element = document.elementFromPoint(x, y);
      if (element) {
        element.click();
      }
    }
  });

  conn.on("close", () => {
    console.log(`Remote peer ${conn.peer} disconnected`);
  });
});

peer.on("error", (err) => {
  console.error("Local peer error:", err);
});

peer.on("disconnected", () => {
  console.log("Local peer disconnected");
});

function step() {
  const average = getAverage();
  x -= sensitivity * Number(average.gamma);
  y -= sensitivity * Number(average.alpha);
  x = Math.min(window.innerWidth, Math.max(0, x));
  y = Math.min(window.innerHeight, Math.max(0, y));
  cursor.style.left = `${x}px`;
  cursor.style.top = `${y}px`;
  samples.shift();
  samples.push({ alpha: 0, beta: 0, gamma: 0 });
  window.requestAnimationFrame(step);
}

window.requestAnimationFrame(step);
