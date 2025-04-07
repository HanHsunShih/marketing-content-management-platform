import Editor from "./internal/Editor";
import useWebSocket from "react-use-websocket";
import { debounce } from "lodash";
import { useCallback, useEffect, useState } from "react";
import styled from "@emotion/styled";

const Container = styled.div`
  width: 100%;
  overflow-y: auto;
  height: 100%;
`;

const ClaimsContainer = styled.div`
  max-height: 66vh;
  overflow-y: auto;
  padding-right: 10px;
  display: flex;
  flex-direction: row;
`;

// const Editor = styled.div`
//   width: 50%;
// `;

const SuggestionsContainer = styled.div`
  position: sticky;
  bottom: 0;
  background: #f7f7f7;
  padding: 10px;
  max-height: 30vh;
`;

export type Issue = {
  type: string;
  severity: string;
  paragraph: number;
  description: string;
  suggestion: string;
};

export interface DocumentProps {
  content: string;
  onContentChange: (content: string) => void;
  injectedIssues?: Issue[];
}

const SOCKET_URL = "ws://localhost:8000/ws";

export default function Document({ content, onContentChange }: DocumentProps) {
  const [messageHistory, setMessageHistory] = useState<MessageEvent[]>([]);

  const [issues, setIssues] = useState<{ issues: Issue[] }>({ issues: [] });

  const { sendMessage, lastMessage } = useWebSocket(SOCKET_URL, {
    onOpen: () => console.log("WebSocket Connected"),
    onClose: () => console.log("WebSocket Disconnected"),
    shouldReconnect: (_closeEvent) => true,
  });

  useEffect(() => {
    if (lastMessage !== null) {
      // console.log("Raw lastMessage:", lastMessage.data);
      try {
        const parsedMessage = JSON.parse(lastMessage.data);
        setIssues(parsedMessage.issues);
      } catch (error) {
        console.error("JSON parse error:", error);
      }
    }
  }, [lastMessage]);

  useEffect(() => {
    if (lastMessage !== null) {
      setMessageHistory((prev) => prev.concat(lastMessage));
      // Handle the incoming message as needed. For example, update the editor content or display suggestions.
      // console.log(lastMessage.data);
    }
  }, [lastMessage, setMessageHistory]);

  // Debounce editor content changes
  const sendEditorContent = useCallback(
    debounce((formattedContent: string) => {
      sendMessage(formattedContent);
    }, 500), // Adjust debounce time as needed
    [sendMessage]
  );

  const handleEditorChange = (content: string) => {
    onContentChange(content);
    const cleanContent = content.replace(/(<([^>]+)>)/gi, "");
    sendEditorContent(cleanContent);
  };

  return (
    <Container>
      <ClaimsContainer>
        <Editor handleEditorChange={handleEditorChange} content={content} />
      </ClaimsContainer>
      <SuggestionsContainer>
        <h2>AI Suggestions</h2>
        <ul>
          {issues.issues?.map((issue, index) => (
            <li key={index}>
              <strong>{issue.type}</strong> ({issue.severity}) -{" "}
              {issue.description}
              <br />
              <em>Suggestion: {issue.suggestion}</em>
            </li>
          ))}
        </ul>
      </SuggestionsContainer>
    </Container>
  );
}
