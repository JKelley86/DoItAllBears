export function showLogin(){

document.getElementById("app").innerHTML=`

<div class="login">

<h1>Kelley Corner</h1>

<p>A private place for the Kelley family.</p>

<input
id="identity"
placeholder="Email">

<input
id="password"
type="password"
placeholder="Password">

<button id="loginButton">

Sign In

</button>

</div>

`;

}
