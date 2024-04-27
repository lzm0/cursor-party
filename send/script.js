const peer = new Peer(null, { host: "/", path: "peer" });
const remoteId = window.location.pathname.split("/")[2];
const grantButton = document.getElementById("grant");
const status = document.getElementById("status");

peer.on("open", (id) => {
  document.getElementById("peer").innerText = id;

  const conn = peer.connect(remoteId, { reliable: true });

  conn.on("open", () => {
    status.innerText = `Connected to ${conn.peer}`;

    window.addEventListener("devicemotion", (event) => {
      conn.send({
        alpha: event.rotationRate.alpha,
        beta: event.rotationRate.beta,
        gamma: event.rotationRate.gamma,
      });
    });

    document.addEventListener("touchstart", () => {
      conn.send("d");
    });

    document.addEventListener("touchend", () => {
      conn.send("u");
    });

    grantButton.addEventListener("click", () => {
      if (!window.DeviceMotionEvent) {
        return alert("Device motion not supported");
      } else {
        conn.send("Requesting permission");
        DeviceMotionEvent.requestPermission()
          .then((response) => {
            if (response === "granted") {
              conn.send("Permission granted");
              grantButton.disabled = true;
              grantButton.innerText = "Permission granted";
            } else {
              conn.send("Permission denied");
            }
          })
          .catch(conn.send);
      }
    });
  });

  conn.on("error", (err) => {
    status.innerText = err;
  });
});

peer.on("error", (err) => {
  status.innerText = err;
});
