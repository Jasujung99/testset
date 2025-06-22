import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry";

export default function ThreeCanvas() {
  const mountRef = useRef(null);
  const [blinkSpeed, setBlinkSpeed] = useState(0.8);
  const [hue, setHue] = useState(330);
  const [bgHue, setBgHue] = useState(0);
  const [bgLightness, setBgLightness] = useState(97);
  const [mode, setMode] = useState("연한"); // "연한" or "진한"
  const [name, setName] = useState("안녕");
  const [textHue, setTextHue] = useState(0);

  const adjustLightness = (current, amount) => {
    let newLightness = current + amount;
    if (newLightness > 97) newLightness = 97;
    if (newLightness < 20) newLightness = 20;
    return newLightness;
  };

  const onLighten = () => {
    setMode("연한");
    setBgLightness((prev) => adjustLightness(prev, +10));
  };

  const onDarken = () => {
    setMode("진한");
    setBgLightness((prev) => adjustLightness(prev, -10));
  };

  useEffect(() => {
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(`hsl(${bgHue}, 100%, ${bgLightness}%)`);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 2, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const planeGeometry = new THREE.PlaneGeometry(20, 20);
    const planeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    scene.add(plane);

    const sphereGeometry = new THREE.SphereGeometry(1, 64, 64);
    const sphereMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(`hsl(${hue}, 100%, ${mode === "연한" ? 70 : 45}%)`),
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.set(0, 1, 0);
    sphere.castShadow = true;
    scene.add(sphere);

    const eyeGeometry = new THREE.SphereGeometry(0.1, 32, 32);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });

    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);

    leftEye.position.set(-0.25, 0.25, 0.9);
    rightEye.position.set(0.25, 0.25, 0.9);

    sphere.add(leftEye);
    sphere.add(rightEye);

    const fontLoader = new FontLoader();
    let nameMesh;

    fontLoader.load(
      "https://cdn.jsdelivr.net/gh/mrdoob/three.js@r148/examples/fonts/gentilis_regular.typeface.json",
      (font) => {
        if (nameMesh) {
          scene.remove(nameMesh);
        }
        const replacedText = name.replace(/[^\u0000-\u007F]/g, "?");
        const textGeometry = new TextGeometry(replacedText, {
          font: font,
          size: 0.3,
          height: 0.05,
        });
        const textMaterial = new THREE.MeshStandardMaterial({
          color: new THREE.Color(`hsl(${textHue}, 100%, 40%)`),
        });
        nameMesh = new THREE.Mesh(textGeometry, textMaterial);
        nameMesh.position.set(-replacedText.length * 0.09, 2.2, 0);
        scene.add(nameMesh);
      }
    );

    let clock = new THREE.Clock();
    let jumpHeight = 1.5;
    let frequency = 2;

    const animate = () => {
      requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();
      const y = 1 + Math.abs(Math.sin(elapsed * frequency)) * jumpHeight;
      sphere.position.y = y;

      const blink = Math.abs(Math.sin(elapsed * blinkSpeed * Math.PI));
      const eyeScaleY = THREE.MathUtils.lerp(0.2, 1, blink);
      leftEye.scale.y = eyeScaleY;
      rightEye.scale.y = eyeScaleY;

      sphere.material.color.setStyle(
        `hsl(${hue}, 100%, ${mode === "연한" ? 70 : 45}%)`
      );
      scene.background.setStyle(`hsl(${bgHue}, 100%, ${bgLightness}%)`);

      if (nameMesh) {
        nameMesh.material.color.setStyle(`hsl(${textHue}, 100%, 40%)`);
        nameMesh.position.y = sphere.position.y + 1.2;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      mountRef.current.removeChild(renderer.domElement);
    };
  }, [blinkSpeed, hue, bgHue, bgLightness, mode, name, textHue]);

  return (
    <div className="relative w-full h-[600px] flex flex-col">
      <div className="flex justify-between px-4 py-2 bg-white bg-opacity-90 shadow space-x-6">
        <div className="w-40 space-y-3">
          <div>
            <label className="text-sm font-semibold mr-2">배경 색</label>
            <input
              type="range"
              min="0"
              max="360"
              step="1"
              value={bgHue}
              onChange={(e) => setBgHue(parseInt(e.target.value, 10))}
              className="w-full"
            />
          </div>
          <div className="flex space-x-2">
            <button
              className={`flex-1 px-2 py-1 rounded border ${
                mode === "진한"
                  ? "bg-gray-700 text-white"
                  : "bg-white text-black"
              }`}
              onClick={onDarken}
            >
              진한
            </button>
            <button
              className={`flex-1 px-2 py-1 rounded border ${
                mode === "연한"
                  ? "bg-gray-300 text-black"
                  : "bg-white text-black"
              }`}
              onClick={onLighten}
            >
              연한
            </button>
          </div>
        </div>

        <div className="w-52 space-y-2">
          <div>
            <label className="text-sm font-semibold mr-2 text-black">이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border rounded px-1 text-black w-full"
            />
          </div>
          <div>
            <label className="text-sm font-semibold mr-2 text-black">
              텍스트 색
            </label>
            <input
              type="range"
              min="0"
              max="360"
              step="1"
              value={textHue}
              onChange={(e) => setTextHue(parseInt(e.target.value, 10))}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-sm font-semibold mr-2">깜박이는 속도</label>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={blinkSpeed}
              onChange={(e) => setBlinkSpeed(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-sm font-semibold mr-2">색</label>
            <input
              type="range"
              min="0"
              max="360"
              step="1"
              value={hue}
              onChange={(e) => setHue(parseInt(e.target.value, 10))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div ref={mountRef} className="flex-1" />
    </div>
  );
}
