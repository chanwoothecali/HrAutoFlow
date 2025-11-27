import os
import json
from typing import Dict

import torch
from datasets import load_dataset, DatasetDict
from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    BitsAndBytesConfig,
    TrainingArguments,
)
from peft import LoraConfig
from trl import SFTTrainer


# ==========================
# 설정 부분
# ==========================

# 1) 베이스 모델 이름 (HF 허브에서 실제 이름으로 교체해서 사용)
MODEL_NAME = "meta-llama/Meta-Llama-3.1-8B-Instruct"  # TODO: 실제 모델 이름으로 바꿔줘

# 2) 데이터 파일 경로 (jsonl, 각 줄: {"input": "...", "output": "..."} )
TRAIN_JSONL_PATH = "train.jsonl"

# 3) 출력 디렉토리
OUTPUT_DIR = "./lora-llama3.1-score"

# 4) 최대 시퀀스 길이 (이력서 길이에 맞춰 조절)
MAX_SEQ_LENGTH = 2048  # 너무 길면 VRAM 터지니 2k 정도에서 시작해도 좋음


# ==========================
# 데이터 포맷팅
# ==========================

def format_example(example: Dict) -> Dict:
    """
    train.jsonl 의 한 줄:
      {"input": "...프롬프트 텍스트...", "output": "{...JSON...}"}
    => SFTTrainer 에 넣기 위한 하나의 text 필드로 합쳐줌.
    """
    # input 끝에 output(정답 JSON) 바로 붙이는 방식
    text = example["input"] + example["output"]
    return {"text": text}


# ==========================
# 메인 함수
# ==========================

def main():
    # --------------------------
    # 1. 데이터셋 로드
    # --------------------------
    if not os.path.exists(TRAIN_JSONL_PATH):
        raise FileNotFoundError(f"{TRAIN_JSONL_PATH} 를 찾을 수 없습니다.")

    raw_datasets: DatasetDict = load_dataset(
        "json",
        data_files={"train": TRAIN_JSONL_PATH},
    )

    # train / eval 나누기 (단순 9:1 split)
    raw_datasets = raw_datasets["train"].train_test_split(test_size=0.1, seed=42)
    train_ds = raw_datasets["train"]
    eval_ds = raw_datasets["test"]

    # 포맷팅
    train_ds = train_ds.map(format_example)
    eval_ds = eval_ds.map(format_example)

    # --------------------------
    # 2. 토크나이저 & 모델 로드 (4bit QLoRA)
    # --------------------------
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.bfloat16,
        bnb_4bit_use_double_quant=True,
    )

    print(f"모델 로드 중... ({MODEL_NAME})")
    tokenizer = AutoTokenizer.from_pretrained(
        MODEL_NAME,
        use_fast=True,
    )

    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    tokenizer.padding_side = "right"

    model = AutoModelForCausalLM.from_pretrained(
        MODEL_NAME,
        quantization_config=bnb_config,
        device_map="auto",
    )

    # --------------------------
    # 3. LoRA 설정
    # --------------------------
    # target_modules 는 모델 구조에 따라 달라질 수 있음 (Llama 계열 기준 예시)
    peft_config = LoraConfig(
        r=64,
        lora_alpha=16,
        lora_dropout=0.1,
        bias="none",
        task_type="CAUSAL_LM",
        target_modules=[
            "q_proj",
            "k_proj",
            "v_proj",
            "o_proj",
            "gate_proj",
            "up_proj",
            "down_proj",
        ],
    )

    # --------------------------
    # 4. 학습 설정
    # --------------------------
    training_args = TrainingArguments(
        output_dir=OUTPUT_DIR,
        per_device_train_batch_size=1,
        per_device_eval_batch_size=1,
        gradient_accumulation_steps=8,  # 효과적인 batch_size ≈ 8
        num_train_epochs=3,
        learning_rate=2e-4,
        logging_steps=10,
        save_steps=200,
        evaluation_strategy="steps",
        eval_steps=200,
        save_total_limit=3,
        bf16=True,  # GPU가 bf16 지원 안 하면 fp16=True 로 바꾸기
        # fp16=True,
        gradient_checkpointing=True,
        optim="paged_adamw_8bit",
        max_grad_norm=1.0,
        lr_scheduler_type="cosine",
        warmup_ratio=0.03,
    )

    # --------------------------
    # 5. SFTTrainer 생성
    # --------------------------
    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        peft_config=peft_config,
        train_dataset=train_ds,
        eval_dataset=eval_ds,
        dataset_text_field="text",
        max_seq_length=MAX_SEQ_LENGTH,
        packing=False,  # 여러 샘플을 한 시퀀스로 붙일지 여부 (여기선 False 추천)
        args=training_args,
    )

    # --------------------------
    # 6. 학습 실행
    # --------------------------
    print("학습 시작!")
    trainer.train()

    # --------------------------
    # 7. LoRA 어댑터 + 토크나이저 저장
    # --------------------------
    print("모델 저장 중...")
    trainer.model.save_pretrained(OUTPUT_DIR)
    tokenizer.save_pretrained(OUTPUT_DIR)
    print(f"저장 완료: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
