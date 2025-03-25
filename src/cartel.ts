export function cartelTemplate(
  idx: number,
  artist: string,
  title: string,
  cover: string
) {
  return `
  <figure class="cartel" data-url="art/${idx}/index.html">
    <img src="/covers/${cover}" alt="" />
    <figcaption>
      <div>${title}</div>
      <div>by ${artist}</div>
    </figcaption>
  </figure>`;
}
