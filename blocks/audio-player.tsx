import { useState, useEffect, useRef } from "react";
import { Box, Spinner, Text, IconButton } from "@primer/react";
import { PlayIcon, SquareFillIcon } from "@primer/octicons-react";
import { FileBlockProps } from "@githubnext/blocks";

export default function AudioPlayer(props: FileBlockProps) {
  const { context } = props;
  const { owner, repo, sha, path } = context;
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${sha}/${path}`;

  const [isPlaying, setIsPlaying] = useState(false);
  const [audioContext, _setAudioContext] = useState(new AudioContext());
  const [audioNode, setAudioNode] = useState(audioContext.createBufferSource());
  const [analyserNode, _setAnalyserNode] = useState(audioContext.createAnalyser());
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetch(url)
      .then(value => value.arrayBuffer())
      .then(buffer => {
        audioContext.decodeAudioData(buffer, audioBuffer => {
          setAudioBuffer(audioBuffer);
        });
      });
  }, []);

  useEffect(() => {
    const container = canvasContainerRef.current!;
    const canvas = canvasRef.current!;
    const context = canvas.getContext("2d")!;
    let frame: number;

    const tick = () => {
      const length = analyserNode.frequencyBinCount;
      const array = new Uint8Array(length);
      analyserNode.getByteTimeDomainData(array);

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#f6f8fa";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.lineWidth = 1;

      const centerY = canvas.height / 2;
      context.beginPath();
      context.strokeStyle = "#6e7781";
      context.moveTo(0, centerY);
      context.lineTo(canvas.width, centerY);
      context.stroke();

      context.beginPath();
      context.strokeStyle = "#24292f";
      for (let i = 0; i < length; ++i) {
        const x = (i / length) * canvas.width;
        const y = (array[i] / 128) * centerY;
        context.moveTo(x, centerY);
        context.lineTo(x, y);
      }
      context.stroke();

      frame = requestAnimationFrame(tick);
    };
    tick();

    const resize = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientWidth;
      canvas.style.width = `${container.clientWidth}px`;
      canvas.style.height = `${container.clientHeight}px`;
    };
    window.addEventListener("resize", resize);
    resize();

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    }
  }, []);

  const togglePlaying = () => {
    if (isPlaying) {
      audioNode.stop();
      setAudioNode(audioContext.createBufferSource());
    } else {
      audioNode.buffer = audioBuffer;
      audioNode.connect(analyserNode);
      analyserNode.connect(audioContext.destination);
      analyserNode.fftSize = 32768;
      analyserNode.smoothingTimeConstant = 1;
      audioNode.start();
    }
    setIsPlaying(isPlaying => !isPlaying);
  };

  return (
    <Box p={4} sx={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "0.5rem" }}>
        {audioBuffer === null
          ? <Spinner />
          : <IconButton aria-label="Play" icon={isPlaying ? SquareFillIcon : PlayIcon} onClick={togglePlaying} />
        }
        <Text>{context.path}</Text>
      </Box>
      <Box
        ref={canvasContainerRef}
        height="50vh"
        width="100%"
      >
        <canvas ref={canvasRef}></canvas>
      </Box>
    </Box>
  );
}
