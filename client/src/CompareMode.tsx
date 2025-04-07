import { useEffect, useState } from "react";
import styled from "@emotion/styled";
import DiffMatchPatch from "diff-match-patch";
import { SelectableVersion } from "./types.ts";
import Editor from "./internal/Editor.tsx";
import axios from "axios";

const Page = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
`;

const CompareContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 20px;
  height: 70vh;
`;

const TextBox = styled.div`
  flex: 1;
  padding: 10px;
  border: 1px solid #ccc;
  overflow-y: auto;
  background-color: #fff;
  white-space: pre-wrap;
  max-height: 50vh;
`;

const ResultBox = styled.div`
  margin-top: 20px;
  padding: 10px;
  background-color: #f9f9f9;
  border: 1px solid #ccc;
  min-height: 100px;

  ins {
    background-color: #d4fcbc;
    text-decoration: none;
  }
  del {
    background-color: #ffe6e6;
    text-decoration: line-through;
  }
`;

interface CompareModeProps {
  currentContent: string;
  leftLabel: string;
  selectableVersions: SelectableVersion[];
  currentDocumentId: number;
  rightLabel: string;
  leftVersionId: number | null;
}

const BACKEND_URL = "http://localhost:8000";

export default function CompareMode({
  currentContent,
  leftLabel,
  selectableVersions,
  currentDocumentId,
  leftVersionId,
}: CompareModeProps) {
  const [leftContent, setLeftContent] = useState("Loading...");
  const [rightContent, setRightContent] = useState<string | null>(() => {
    return localStorage.getItem("rightContent") || null;
  });
  const [resultHtml, setResultHtml] = useState<string>(() => {
    return localStorage.getItem("resultHtml") || "";
  });
  const [rightLabel, setRightLabel] = useState<string>(() => {
    return localStorage.getItem("rightLabel") || "Version B";
  });
  const [activeSide, setActiveSide] = useState<"left" | "right" | null>(null);

  const [currentLeftContent, setCurrentLeftContent] = useState("");
  const [currentRightContent, setCurrentRightContent] = useState("");

  const [originalLeftContent, setOriginalLeftContent] = useState("");
  const [originalRightContent, setOriginalRightContent] = useState("");
  const [rightVersionId, setRightVersionId] = useState<number | null>(null);

  const isReadyToCompare = !!rightContent && rightContent.trim() !== "";

  useEffect(() => {
    formatLeftContent();
    console.log("leftLabel: ", leftLabel);
  }, []);

  useEffect(() => {
    console.log("currentLeftContent: ", currentLeftContent);
  }, [currentLeftContent]);

  useEffect(() => {
    console.log("currentRightContent: ", currentRightContent);
  }, [currentRightContent]);

  const formatLeftContent = () => {
    const cleanContent = currentContent.replace(/(<([^>]+)>)/gi, "");
    setLeftContent(cleanContent);
  };

  const handleRightContent = async (apiContent: string, label: string) => {
    const cleanContent = apiContent.replace(/(<([^>]+)>)/gi, "");
    setRightContent(cleanContent);
    setRightLabel(label);

    localStorage.setItem("rightLabel", label);
    localStorage.setItem("rightContent", cleanContent);
  };

  const handleSelectVersion = async (
    documentID: number,
    versionID: number | null
  ) => {
    try {
      let response;
      let label = "";
      if (versionID === null) {
        response = await axios.get(`${BACKEND_URL}/document/${documentID}`);
        label = `Patent ${documentID} - Main`;

        const apiContent = response.data.content.replace(/(<([^>]+)>)/gi, "");
        handleRightContent(apiContent, label);
      } else {
        response = await axios.get(
          `${BACKEND_URL}/document/${documentID}/versions/${versionID}`
        );
        label = `Patent ${documentID} - Version ${versionID}`;

        const apiContent = response.data.content.replace(/(<([^>]+)>)/gi, "");
        handleRightContent(apiContent, label);
      }
    } catch (error) {
      console.error("Error fetching selected version: ", error);
    }
    return;
  };

  const saveUpdatedContent = async (
    versionId: number | null,
    documentId: number,
    content: string
  ) => {
    if (versionId === null) {
      try {
        await axios.post(`${BACKEND_URL}/save/${documentId}`, {
          content: content,
        });
      } catch (error) {
        console.error("Error saving new version for main patent: ", error);
      }
    } else {
      try {
        await axios.post(
          `${BACKEND_URL}/save/${documentId}/version/${versionId}`,
          { content: content }
        );
      } catch (error) {
        console.error("Error saving new version:", error);
      }
    }
  };

  const handleCompare = async () => {
    if (rightContent === null) {
      console.log("rightContent is null");
      return;
    }

    if (currentLeftContent !== originalLeftContent) {
      await saveUpdatedContent(
        leftVersionId,
        currentDocumentId,
        currentLeftContent
      );
    }

    if (currentRightContent !== originalRightContent) {
      await saveUpdatedContent(
        rightVersionId,
        currentDocumentId,
        currentRightContent
      );
    }

    const dmp = new DiffMatchPatch();
    const diff = dmp.diff_main(leftContent, rightContent);
    dmp.diff_cleanupSemantic(diff);

    const html = diff
      .map(([type, text]) => {
        if (type === DiffMatchPatch.DIFF_INSERT) return `<ins>${text}</ins>`;
        if (type === DiffMatchPatch.DIFF_DELETE) return `<del>${text}</del>`;
        return `<span>${text}</span>`;
      })
      .join("");

    setResultHtml(html);
    localStorage.setItem("resultHtml", html);
  };

  const handleExit = () => {
    const keysToRemove = [
      "isCompareMode",
      "rightContent",
      "currentDocumentId",
      "currentVersionId",
      "selectableVersions",
      "resultHtml",
    ];

    keysToRemove.forEach((key) => localStorage.removeItem(key));
    window.location.reload();
  };

  return (
    <Page onClick={() => setActiveSide(null)}>
      <CompareContainer>
        <TextBox
          onClick={(e) => {
            e.stopPropagation();
            isReadyToCompare && setActiveSide("left");
            setOriginalLeftContent(leftContent);
          }}
          style={{
            border: activeSide === "left" ? "2px solid blue" : "none",
          }}
        >
          <h3>{leftLabel}</h3>
          {activeSide === "left" ? (
            <Editor
              content={leftContent}
              handleEditorChange={(newContent: string) => {
                setLeftContent(newContent);
                setCurrentLeftContent(newContent);
              }}
            />
          ) : (
            <div dangerouslySetInnerHTML={{ __html: leftContent }} />
          )}
        </TextBox>
        <TextBox
          onClick={(e) => {
            e.stopPropagation();
            setActiveSide("right");
            setOriginalRightContent(rightContent || "");
          }}
          style={{
            border: activeSide === "right" ? "2px solid blue" : "none",
          }}
        >
          {!rightContent || rightContent === "" ? (
            <>
              <p>Choose a file to compare:</p>
              {selectableVersions.length === 0 ? (
                <p>There's no version to compare.</p>
              ) : (
                selectableVersions.map((version) => (
                  <button
                    key={version.id ?? "main"}
                    onClick={() => {
                      handleSelectVersion(currentDocumentId, version.id);
                      setRightVersionId(version.id);
                    }}
                  >
                    {version.label}
                  </button>
                ))
              )}
            </>
          ) : (
            <>
              <h3>{rightLabel}</h3>
              {activeSide === "right" ? (
                <Editor
                  content={rightContent}
                  handleEditorChange={(newContent: string) => {
                    setRightContent(newContent);
                    setCurrentRightContent(newContent);
                  }}
                />
              ) : (
                <div dangerouslySetInnerHTML={{ __html: rightContent }} />
              )}
            </>
          )}
        </TextBox>
      </CompareContainer>
      <div
        style={{ display: "flex", justifyContent: "center", marginTop: "1rem" }}
      >
        <button
          onClick={isReadyToCompare ? handleCompare : undefined}
          disabled={!isReadyToCompare}
        >
          Compare
        </button>
        <button onClick={handleExit}>Exit Compare Mode</button>
      </div>
      <ResultBox dangerouslySetInnerHTML={{ __html: resultHtml }} />
    </Page>
  );
}
