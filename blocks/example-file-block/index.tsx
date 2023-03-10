import { FileBlockProps } from "@githubnext/blocks";
import { Box, Text } from "@primer/react";
import "./index.css";

export default function ExampleFileBlock(props: FileBlockProps) {
  const { context } = props;
  const url = `https://raw.githubusercontent.com/${context.owner}/${context.repo}/${context.sha}/${context.path}`;

  return (
    <Box p={4} display="flex" flexDirection="column">
      <Text>{context.path}</Text>
      <audio controls src={url} />
    </Box>
  );
}
