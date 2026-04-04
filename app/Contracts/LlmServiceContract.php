<?php

namespace App\Contracts;

interface LlmServiceContract
{
    public function generate(string $prompt, string $system = ''): string;
    
    public function generateTitle(string $text): string;

    public function getEmbedding(string $text): array;

    public function checkStatus(): array; 
}
