/*
 * chokidarFileWatcherProvider.ts
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT license.
 *
 * Implements a FileWatcherProvider using chokidar.
 */

import * as chokidar from 'chokidar';
import * as fs from 'fs';
import * as path from 'path';

import { ConsoleInterface } from './console';
import { FileWatcher, FileWatcherEventHandler, FileWatcherProvider } from './fileWatcher';

const _isMacintosh = process.platform === 'darwin';
const _isLinux = process.platform === 'linux';

export class ChokidarFileWatcherProvider implements FileWatcherProvider {
    constructor(private _console?: ConsoleInterface) {}

    createFileWatcher(paths: string[], listener: FileWatcherEventHandler): FileWatcher {
        return this._createFileSystemWatcher(paths).on('all', listener);
    }

    private _createFileSystemWatcher(paths: string[]): chokidar.FSWatcher {
        // The following options are copied from VS Code source base. It also
        // uses chokidar for its file watching.
        const watcherOptions: chokidar.WatchOptions = {
            ignoreInitial: true,
            ignorePermissionErrors: true,
            followSymlinks: true, // this is the default of chokidar and supports file events through symlinks
            interval: 1000, // while not used in normal cases, if any error causes chokidar to fallback to polling, increase its intervals
            binaryInterval: 1000,
            disableGlobbing: true, // fix https://github.com/Microsoft/vscode/issues/4586
            awaitWriteFinish: {
                // this will make sure we re-scan files once file changes are written to disk
                stabilityThreshold: 1000,
                pollInterval: 1000,
            },
        };

        if (_isMacintosh) {
            watcherOptions.usePolling = false;
        }

        const standardExcludePatterns: string[] = ['/node_modules/', '/__pycache__/'];

        const platformExcludes: string[] = [];
        if (_isMacintosh || _isLinux) {
            if (paths.some((p) => p === '' || p === '/')) {
                platformExcludes.push('/dev/');
                if (_isLinux) {
                    platformExcludes.push('/proc/', '/sys/');
                }
            }
        }

        const isStandardExcluded = (testPath: string): boolean => {
            // Normalize path for consistent matching: ensure leading slash, use unix separators.
            const normalizedPath = path.normalize(`/${testPath}`).replace(/\\/g, '/');

            if (standardExcludePatterns.some((pattern) => normalizedPath.includes(pattern))) {
                return true;
            }

            // Check if any part of the path starts with a dot (hidden file/directory).
            if (normalizedPath.split('/').some((part) => part.startsWith('.'))) {
                return true;
            }

            // Check if the path starts with any platform-specific exclude patterns.
            if (platformExcludes.some((pattern) => normalizedPath.startsWith(pattern))) {
                return true;
            }

            return false;
        };

        // Use a AnymatchMatcher handler function for `ignored`
        // This allows us to ignore non-Python *files* while still traversing directories.
        watcherOptions.ignored = (testPath: string, stats?: fs.Stats): boolean => {
            if (isStandardExcluded(testPath)) {
                return true;
            }

            if (stats && stats.isFile()) {
                if (!path.basename(testPath).endsWith('.py')) {
                    // Ignore non-Python files.
                    return true;
                }
            }

            return false;
        };

        const watcher = chokidar.watch(paths, watcherOptions);

        if (_isMacintosh && !watcher.options.useFsEvents) {
            this._console?.info('Watcher could not use native fsevents library. File system watcher disabled.');
        }

        return watcher;
    }
}
