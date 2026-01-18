<?php

namespace App\Services\Archive;

interface ArchiveHandlerInterface
{
    /**
     * Fetch the original record data
     *
     * @param int $id
     * @return array|null
     */
    public function fetchRecord(int $id): ?array;

    /**
     * Delete the original record
     *
     * @param int $id
     * @return bool
     */
    public function deleteRecord(int $id): bool;

    /**
     * Restore the archived record
     *
     * @param array $data
     * @return int The ID of the restored record
     */
    public function restoreRecord(array $data): int;

    /**
     * Get the archive type name
     *
     * @return string
     */
    public function getArchiveType(): string;
}
