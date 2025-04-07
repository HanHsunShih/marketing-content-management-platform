import styled from "@emotion/styled";
import Document from "./Document";
import CompareMode from "./CompareMode";
import { useEffect, useState } from "react";
import axios from "axios";
import LoadingOverlay from "./internal/LoadingOverlay";
import Logo from "./assets/logo.png";
import { SelectableVersion } from "./types.ts";
import {
  fetchPatent,
  savePatentAPI,
  createVersionAPI,
  fetchAllVersions,
  fetchVersionContentAPI,
  saveVersionAPI,
  deleteVersionAPI,
} from "./utils/api";

const Page = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
`;

const Header = styled.header`
  position: fixed;
  display: flex;
  align-items: center;
  justify-content: center;
  top: 0;
  width: 100%;
  background-color: #006284;
  color: white;
  text-align: center;
  z-index: 1000;
  margin-bottom: 30px;
  height: 80px;
`;

const DocumentTitle = styled.h2`
  color: #213547;
  opacity: 0.6;
  align-self: flex-start;
`;

const Content = styled.div`
  display: flex;
  height: calc(100% - 100px);
  flex-direction: row;
  gap: 20px;
  justify-content: center;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin: 90px 20px 20px 20px;
  width: calc(100% - 40px);
`;

interface ColumnProps {
  flex?: string | number;
}

const Column = styled.div<ColumnProps>`
  display: flex;
  flex-direction: column;
  height: 100%;
  align-items: center;
  gap: 10px;
  padding: 0 20px;
  flex: ${(props) => props.flex || "none"};
`;

const BACKEND_URL = "http://localhost:8000";

function App() {
  const [currentDocumentContent, setCurrentDocumentContent] = useState<string>(
    () => {
      return localStorage.getItem("currentDocumentContent") || "";
    }
  );
  const [currentDocumentId, setCurrentDocumentId] = useState<number>(() => {
    const saved = localStorage.getItem("currentDocumentId");
    return saved ? Number(saved) : 0;
  });
  const [currentVersionId, setCurrentVersionId] = useState<number | null>(
    () => {
      const saved = localStorage.getItem("currentVersionId");
      return saved !== null ? Number(saved) : null;
    }
  );
  const [versions, setVersions] = useState<{
    [key: number]: { id: number; created_at: string; patent_parent: number }[];
  }>({});
  const [versionName, setVersionName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCompareMode, setIsCompareMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("isCompareMode");
    return saved === "true";
  });
  const [selectableVersions, setSelectableVersions] = useState<
    SelectableVersion[]
  >(() => {
    const saved = localStorage.getItem("selectableVersions");
    return saved ? JSON.parse(saved) : [];
  });
  const [rightLabel, setRightLabel] = useState<string>(() => {
    return localStorage.getItem("rightLabel") || "Version B";
  });
  const [originalContent, setOriginalContent] = useState<string>("");

  const currentHasUnsavedChanges = currentDocumentContent !== originalContent;

  useEffect(() => {
    loadPatent(1);
    loadVersion();
  }, []);

  useEffect(() => {
    localStorage.setItem("isCompareMode", String(isCompareMode));
  }, [isCompareMode]);

  const loadPatent = async (documentNumber: number) => {
    setIsLoading(true);
    console.log("Loading patent:", documentNumber);
    try {
      const response = await fetchPatent(documentNumber);

      setCurrentDocumentContent(response.data.content);
      setCurrentDocumentId(documentNumber);
      setCurrentVersionId(null);
      setVersionName(null);
      setOriginalContent(response.data.content);

      localStorage.setItem("currentDocumentId", String(currentDocumentId));
    } catch (error) {
      console.error("Error loading document:", error);
    }
    setIsLoading(false);
  };

  const savePatent = async (
    documentNumber: number,
    currentDocumentContent: string
  ) => {
    setIsLoading(true);
    try {
      await savePatentAPI(documentNumber, currentDocumentContent);
      // await axios.post(`${BACKEND_URL}/save/${documentNumber}`, {
      //   content: currentDocumentContent,
      // });
    } catch (error) {
      console.error("Error saving document:", error);
    }
    setIsLoading(false);
  };

  const createVersion = async (documentNumber: number, content: string) => {
    setIsLoading(true);
    try {
      const response = await createVersionAPI(documentNumber, content);
      const newVersion = {
        id: response.data.version_id,
        created_at: response.data.created_at,
        patent_parent: documentNumber,
      };

      setVersions((prevVersions) => ({
        ...prevVersions,
        [documentNumber]: [...(prevVersions[documentNumber] || []), newVersion],
      }));

      await loadVersionContent(documentNumber, newVersion.id);
    } catch (error) {
      console.error("Error creating new version:" + error);
    }
    setIsLoading(false);
  };

  const loadVersion = async () => {
    setIsLoading(true);
    try {
      const response = await fetchAllVersions();
      const displayVersions = response.data;
      setVersions(displayVersions);
    } catch (error) {
      console.error("Error loading version:", error);
    }
    setIsLoading(false);
  };

  const loadVersionContent = async (
    documentNumber: number,
    versionNumber: number
  ) => {
    setIsLoading(true);
    try {
      const response = await fetchVersionContentAPI(
        documentNumber,
        versionNumber
      );

      setCurrentDocumentContent(response.data.content);
      setCurrentDocumentId(response.data.patent_parent);
      setCurrentVersionId(response.data.id);
      setVersionName(response.data.created_at);
      setOriginalContent(response.data.content);

      localStorage.setItem("currentDocumentId", String(currentDocumentId));
      localStorage.setItem(
        "currentVersionId",
        currentVersionId !== null ? String(currentVersionId) : ""
      );
    } catch (error) {
      console.error("Error loading document: " + error);
    }
    setIsLoading(false);
  };

  const saveVersion = async (
    documentNumber: number,
    version_id: number,
    content: string
  ) => {
    setIsLoading(true);
    try {
      await saveVersionAPI(documentNumber, version_id, content);
    } catch (error) {
      console.error("Error saving document:", error);
    }
    setIsLoading(false);
  };

  const handleSwitchToMain = async (newDocumentId: number) => {
    if (currentHasUnsavedChanges) {
      if (currentVersionId === null) {
        await savePatent(currentDocumentId, currentDocumentContent);
      } else {
        await saveVersion(
          currentDocumentId,
          currentVersionId,
          currentDocumentContent
        );
      }
    }

    await loadPatent(newDocumentId);
  };

  const handleSwitchToVersion = async (
    newPatentId: number,
    newVersionId: number
  ) => {
    if (currentHasUnsavedChanges) {
      if (currentVersionId === null) {
        await savePatent(currentDocumentId, currentDocumentContent);
      } else {
        await saveVersion(
          currentDocumentId,
          currentVersionId,
          currentDocumentContent
        );
      }
    }

    await loadVersionContent(newPatentId, newVersionId);
  };

  const deleteVersion = async (patentParent: number, versionId: number) => {
    try {
      await deleteVersionAPI(patentParent, versionId);

      setVersions((prevVersions) => ({
        ...prevVersions,
        [patentParent]:
          prevVersions[patentParent]?.filter((v) => v.id !== versionId) || [],
      }));
      await loadPatent(patentParent);

      console.log(`Deleted version ${versionId}`);
    } catch (error) {
      console.error("Error deleting version:", error);
    }
  };

  const HandleSaveAndCompare = async (
    documentNumber: number,
    version_id: number | null
  ) => {
    try {
      if (currentVersionId === null) {
        await axios.post(`${BACKEND_URL}/save/${documentNumber}`, {
          content: currentDocumentContent,
        });
      } else {
        await axios.post(
          `${BACKEND_URL}/save/${documentNumber}/version/${version_id}`,
          {
            content: currentDocumentContent,
          }
        );
      }

      getSelectableVersions(currentDocumentId, currentVersionId);
      setIsCompareMode(true);
      localStorage.setItem("isCompareMode", "true");
      localStorage.setItem("currentDocumentContent", currentDocumentContent);
    } catch (error) {
      console.error("Error change to compare mode: ", error);
    }
  };

  const getSelectableVersions = (
    currentDocumentId: number,
    currentVersionId: number | null
  ) => {
    const currentPatentVersions = versions[currentDocumentId] || [];

    const result = [];

    if (currentVersionId === null) {
      result.push(
        ...currentPatentVersions.map((version) => ({
          id: version.id,
          label: `Patent ${currentDocumentId} - Version ${version.id}`,
          isMain: false,
          created_at: version.created_at,
        }))
      );
    } else {
      result.push({
        id: null,
        label: `Patent ${currentDocumentId}`,
        isMain: true,
        created_at: "",
      });

      result.push(
        ...currentPatentVersions
          .filter((v) => v.id !== currentVersionId)
          .map((version) => ({
            id: version.id,
            label: `Patent ${currentDocumentId} - Version ${version.id}`,
            isMain: false,
            created_at: version.created_at,
          }))
      );
    }
    setSelectableVersions(result);
    localStorage.setItem("selectableVersions", JSON.stringify(result));
  };

  return (
    <Page>
      {isLoading && <LoadingOverlay />}
      <Header>
        <img src={Logo} alt="Logo" style={{ height: "50px" }} />
      </Header>
      <Content>
        {!isCompareMode && (
          <>
            <Column>
              {Object.entries(versions).length === 0 ? (
                <p>Loading versions...</p>
              ) : (
                Object.entries(versions).map(([patentId, versionList]) => (
                  <div key={patentId}>
                    <button
                      onClick={() => handleSwitchToMain(Number(patentId))}
                      style={{
                        backgroundColor:
                          currentDocumentId === Number(patentId) &&
                          currentVersionId === null
                            ? "black"
                            : "",
                        color:
                          currentDocumentId === Number(patentId) &&
                          currentVersionId === null
                            ? "white"
                            : "",
                      }}
                    >
                      Patent {patentId}
                    </button>
                    {versionList.map((version) => (
                      <button
                        key={`version-${version.id}`}
                        className="version-btn"
                        onClick={() =>
                          handleSwitchToVersion(Number(patentId), version.id)
                        }
                        style={{
                          backgroundColor:
                            currentDocumentId === Number(patentId) &&
                            currentVersionId === version.id
                              ? "black"
                              : "",
                          color:
                            currentDocumentId === Number(patentId) &&
                            currentVersionId === version.id
                              ? "white"
                              : "",
                        }}
                      >
                        <span>{version.created_at}</span>
                        <span
                          className="trash-icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteVersion(version.patent_parent, version.id);
                          }}
                        >
                          🗑
                        </span>
                      </button>
                    ))}
                  </div>
                ))
              )}
            </Column>
            <Column flex={1}>
              {!currentVersionId ? (
                <DocumentTitle>{`Patent ${currentDocumentId} `}</DocumentTitle>
              ) : (
                <DocumentTitle>{`Patent ${currentDocumentId} ${versionName}`}</DocumentTitle>
              )}
              <Document
                onContentChange={setCurrentDocumentContent}
                content={currentDocumentContent}
              />
            </Column>
            <Column>
              <button
                onClick={() =>
                  currentVersionId
                    ? saveVersion(
                        currentDocumentId,
                        currentVersionId,
                        currentDocumentContent
                      )
                    : savePatent(currentDocumentId, currentDocumentContent)
                }
              >
                Save
              </button>
              <button
                onClick={() =>
                  createVersion(currentDocumentId, currentDocumentContent)
                }
              >
                Creat New Version
              </button>
              <button
                onClick={() =>
                  HandleSaveAndCompare(currentDocumentId, currentVersionId)
                }
              >
                Compare
              </button>
            </Column>
          </>
        )}
        {isCompareMode && (
          <CompareMode
            currentContent={currentDocumentContent}
            leftLabel={
              currentVersionId
                ? `Patent ${currentDocumentId} - Version ${currentVersionId}`
                : `Patent ${currentDocumentId} - Main`
            }
            selectableVersions={selectableVersions}
            currentDocumentId={currentDocumentId}
            rightLabel={rightLabel}
            leftVersionId={currentVersionId}
          />
        )}
      </Content>
    </Page>
  );
}

export default App;
