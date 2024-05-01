export type Rect = {
  x: number,
  y: number,
  line: number,
  column: number,
}

export default class RectMatrix<R extends Rect = Rect> {
  matrix: R[][]
  list: R[]

  constructor(rects: R[]) {
    const margin = 5
    const matchesLine = ({y: ya}: R, {y: yb}: R) => ya - margin < yb && yb < ya + margin
    const matchesColumn = ({x: xa}: R, {x: xb}: R) => xa - margin < xb && xb < xa + margin
    this.matrix = []
    outer: for (const wordleRect of rects) {
      for (const line of this.matrix) {
        if (matchesLine(line[0], wordleRect)) {
          line.push(wordleRect)
          continue outer
        }
      }
      this.matrix.push([wordleRect])
    }

    this.matrix.sort(([{y: ya}], [{y: yb}]) => ya - yb)
    this.matrix.forEach(line => line.sort(({x: xa}, {x: xb}) => xa - xb))

    this.list = []
    for (let i = 0; i < 6; i++) {
      const line = this.matrix[i]
      for (let j = 0, columnIndex = 0; columnIndex < 5; j++, columnIndex++) {
        const rect = line?.[j]
        if (!rect) continue // this happens when the last one is missing
        rect.line = i
        const isCorrectColumn = this.matrix.filter(line => line[columnIndex] && matchesColumn(line[columnIndex], rect)).length >= 3
        if (!isCorrectColumn) {
          j--
          continue
        }
        rect.column = columnIndex
        this.list.push(rect)
      }
    }
  }

  get(line: number, column: number) {
    return this.list.find(rect => rect.line === line && rect.column === column)
  }

  getLine(line: number) {
    return this.matrix[line]
  }
}
