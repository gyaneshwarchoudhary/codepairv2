import React, {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import * as monaco from "@monaco-editor/react";
import { useLocation } from "react-router-dom";

const Editor = forwardRef(
  ({ socketRef, roomId, language, onCodeChange, onCommentsChange }, ref) => {
    const editorRef = useRef(null);
    const monacoRef = useRef(null);
    const decorationsRef = useRef([]);
    const location = useLocation();

    useImperativeHandle(ref, () => ({
      scrollToLine: (lineNumber) => {
        editorRef.current.revealLineInCenter(lineNumber + 1);
      },
    }));

    const handleEditorDidMount = (editor, monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;

      // Add comment widget on line click
      editor.onMouseDown((e) => {
        if (e.target.type === 4) {
          // Clicking on the line number
          const lineNumber = e.target.position.lineNumber - 1;
          const comment = prompt("Add Comment");
          if (comment) {
            const commentId = new Date().getTime();
            socketRef.current.emit("add-comment", {
              roomId,
              comment: {
                lineNumber,
                comment,
                user: location.state?.username,
                id: commentId,
              },
            });
          }
        }
      });

      // Handle content changes
      editor.onDidChangeModelContent((event) => {
        const code = editor.getValue();
        onCodeChange(code);

        if (!event.isFlush) {
          socketRef.current.emit("code-change", {
            roomId,
            code,
          });
        }
      });

      // Set initial template code
      editor.setValue(getDefaultCode(language));
    };

    // Function to add a comment decoration
    const addComment = (lineNumber, comment, user, id) => {
      if (!editorRef.current) return;

      // Create comment marker
      const marker = {
        range: new monacoRef.current.Range(
          lineNumber + 1,
          1,
          lineNumber + 1,
          1
        ),
        options: {
          isWholeLine: true,
          glyphMarginClassName: "comment-glyph",
          glyphMarginHoverMessage: { value: `${user}: ${comment}` },
          className: "line-comment",
        },
      };

      // Add decoration
      const decorations = editorRef.current.deltaDecorations([], [marker]);
      decorationsRef.current = [...decorationsRef.current, ...decorations];

      // Update comments state
      onCommentsChange((prev) => [...prev, { lineNumber, comment, user, id }]);
    };

    // Get default code for selected language
    const getDefaultCode = (lang) => {
      const templates = {
        javascript: `// Write your JavaScript code here
console.log("Hello, World!");`,
        python: `# Write your Python code here
print("Hello, World!")`,
        java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
        cpp: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`,
        csharp: `using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello, World!");
    }
}`,
      };
      return templates[lang] || templates.javascript;
    };

    // Handle real-time code sync
    useEffect(() => {
      if (socketRef.current) {
        socketRef.current.on("code-change", ({ code }) => {
          if (code !== null && editorRef.current) {
            const position = editorRef.current.getPosition();
            editorRef.current.setValue(code);
            editorRef.current.setPosition(position);
          }
        });

        socketRef.current.on("add-comment", ({ comment }) => {
          if (comment) {
            const { lineNumber, comment: text, user, id } = comment;
            addComment(lineNumber, text, user, id);
          }
        });
      }

      return () => {
        socketRef.current?.off("code-change");
        socketRef.current?.off("add-comment");
      };
    }, [socketRef.current]);

    // Update editor language when language prop changes
    useEffect(() => {
      if (editorRef.current) {
        const model = editorRef.current.getModel();
        if (model) {
          // Set the model's language explicitly
          monacoRef.current.editor.setModelLanguage(model, language);

          // Reset content with the corresponding template
          editorRef.current.setValue(getDefaultCode(language));
        }
      }
    }, [language]); // This effect depends on the `language` prop

    return (
      <div className="mt-1 pt-2" style={{ height: "500px" }}>
        <monaco.Editor
          height="100%"
          defaultLanguage={language}
          defaultValue={getDefaultCode(language)}
          theme="vs-dark"
          options={{
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            fontSize: 16,
            glyphMargin: true,
            lineNumbers: true,
            folding: true,
            lineDecorationsWidth: 20,
            lineNumbersMinChars: 3,
            suggestOnTriggerCharacters: true,
            wordBasedSuggestions: true,
            parameterHints: {
              enabled: true,
            },
            snippetSuggestions: "inline",
            formatOnPaste: true,
            formatOnType: true,
            autoClosingBrackets: "always",
            autoClosingQuotes: "always",
            tabCompletion: "on",
            wordWrap: "on",
          }}
          onMount={handleEditorDidMount}
        />
      </div>
    );
  }
);

export default Editor;
