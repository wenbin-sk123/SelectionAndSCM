import { useState } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import AwsS3 from "@uppy/aws-s3";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => void;
  buttonClassName?: string;
  children: ReactNode;
}

/**
 * A file upload component that renders as a button and provides a modal interface for
 * file management.
 * 
 * Features:
 * - Renders as a customizable button that opens a file upload modal
 * - Provides a modal interface for:
 *   - File selection
 *   - File preview
 *   - Upload progress tracking
 *   - Upload status display
 * 
 * The component uses Uppy under the hood to handle all file upload functionality.
 * All file management features are automatically handled by the Uppy dashboard modal.
 * 
 * @param props - Component props
 * @param props.maxNumberOfFiles - Maximum number of files allowed to be uploaded
 *   (default: 1)
 * @param props.maxFileSize - Maximum file size in bytes (default: 10MB)
 * @param props.onGetUploadParameters - Function to get upload parameters (method and URL).
 *   Typically used to fetch a presigned URL from the backend server for direct-to-S3
 *   uploads.
 * @param props.onComplete - Callback function called when upload is complete. Typically
 *   used to make post-upload API calls to update server state and set object ACL
 *   policies.
 * @param props.buttonClassName - Optional CSS class name for the button
 * @param props.children - Content to be rendered inside the button
 */
export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [uppy] = useState(() =>
    new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
      },
      autoProceed: false,
    })
      .use(AwsS3, {
        shouldUseMultipart: false,
        getUploadParameters: onGetUploadParameters,
      })
      .on("complete", (result) => {
        onComplete?.(result);
        setShowModal(false);
      })
  );

  return (
    <div>
      <Button onClick={() => setShowModal(true)} className={buttonClassName}>
        {children}
      </Button>

      <DashboardModal
        uppy={uppy}
        open={showModal}
        onRequestClose={() => setShowModal(false)}
        proudlyDisplayPoweredByUppy={false}
        locale={{
          strings: {
            closeModal: '关闭',
            importFrom: '导入来源',
            addMoreFiles: '添加更多文件',
            importFiles: '导入文件',
            dropPasteImport: '拖放文件到这里或 %{browse}',
            browse: '浏览',
            uploadComplete: '上传完成',
            uploadPaused: '上传暂停',
            resumeUpload: '恢复上传',
            pauseUpload: '暂停上传',
            retryUpload: '重试上传',
            cancelUpload: '取消上传',
            xFilesSelected: {
              0: '%{smart_count} 个文件选中',
              1: '%{smart_count} 个文件选中',
            },
            uploadingXFiles: {
              0: '正在上传 %{smart_count} 个文件',
              1: '正在上传 %{smart_count} 个文件',
            },
            processingXFiles: {
              0: '正在处理 %{smart_count} 个文件',
              1: '正在处理 %{smart_count} 个文件',
            },
            poweredBy: '技术支持：',
            addMore: '添加更多',
            editFileWithFilename: '编辑文件 %{file}',
            save: '保存',
            cancel: '取消',
            dropPasteFiles: '拖放文件到这里或 %{browseFiles}',
            dropPasteFolders: '拖放文件到这里或 %{browseFolders}',
            dropPasteBoth: '拖放文件到这里或 %{browseFiles} 或 %{browseFolders}',
            browseFiles: '浏览文件',
            browseFolders: '浏览文件夹',
            recoveredXFiles: {
              0: '无法完全恢复 %{smart_count} 个文件。请重新选择并恢复上传。',
              1: '无法完全恢复 %{smart_count} 个文件。请重新选择并恢复上传。',
            },
            recoveredAllFiles: '已恢复所有文件。现在可以恢复上传。',
            sessionRestored: '会话已恢复',
            reSelect: '重新选择',
            missingRequiredMetaFields: {
              0: '缺少必填字段：%{fields}。',
              1: '缺少必填字段：%{fields}。',
            },
          },
        }}
      />
    </div>
  );
}