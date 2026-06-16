# TRPG 작업 관리 도구

Roll20용 TRPG 시나리오를 작성·구조화하는 단일 HTML 파일 도구. 시나리오 본문은 중첩 가능한 블록 트리로 구성되며, 블록·하위요소는 Roll20 채팅에 붙여넣는 매크로를 생성한다.

## Language

**시나리오 (Scenario)**:
블록 트리 하나를 담는 최상위 저작 단위. 상태(`state.scenarios`)에 보관되고 IndexedDB로 영속화된다.
_Avoid_: 문서, 프로젝트

**블록 (Block)**:
시나리오 본문의 기본 구성 요소. 종류: roll(판정)·branch(분기)·callout·speech(대사)·text·ending(엔딩)·chapter(소제목)·divider·column·toggle. 블록은 다른 블록을 중첩한다.
_Avoid_: 노드, 요소, 컴포넌트

**판정 블록 (Roll block)**:
성공/실패/기타 결과 칸을 가진 블록. 각 결과 칸은 다시 블록을 품는다.
_Avoid_: roll, 주사위 블록

**분기 내부 블록 (Branch inner-block)**:
분기(branch) 블록 안의 선택지별 내용 컨테이너. 그 안에 판정·콜아웃·대사 등 항목(item)을 담는다.
_Avoid_: ib(코드 약어), 서브블록

**CSS 매크로 오버라이드 (CSS macro override)**:
블록 또는 하위요소가 들고 있는 `css` 필드. 비어 있지 않으면 자동 생성 매크로 대신 이 원시 Roll20 매크로를 복사 대상으로 쓴다. 편집 가능한 HTML이 아니라 원시 텍스트다.
_Avoid_: 스타일, 서식 문자열

**CSS 매크로 필드 (cssMacroField)**:
CSS 매크로 오버라이드를 편집하는 깊은(deep) 모듈. 패널 마크업·토글·읽기·쓰기·저장을 한곳에서 소유하고, 호출지는 대상 `css`에 대한 `get/set` 접근자만 주입한다. 현재 36곳에 흩어진 얕은(shallow) 중복을 대체한다.
_Avoid_: css 패널, btcp, 서식 편집기
