<?php

namespace App\Exceptions;

use Exception;

class BusinessException extends Exception
{
    /**
     * HTTP Status Code.
     */
    protected int $status;

    /**
     * Constructor.
     */
    public function __construct(
        string $message,
        int $status = 422
    ) {

        parent::__construct($message);

        $this->status = $status;
    }

    /**
     * Get HTTP Status.
     */
    public function getStatus(): int
    {
        return $this->status;
    }
}